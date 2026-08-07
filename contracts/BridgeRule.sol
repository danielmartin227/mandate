// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IUSDC {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface ITokenMessengerV2 {
    function depositForBurn(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken,
        bytes32 destinationCaller,
        uint256 maxFee,
        uint32 minFinalityThreshold
    ) external;
}

/// @title BridgeRule
/// @notice A standing treasury rule: when the USDC balance exceeds a floor, bridge
///         the surplus to a recipient on another chain via CCTP V2.
///
/// @dev Design notes that matter:
///
///  - THIS CONTRACT IS THE TREASURY. Payments are sent directly to this address.
///    There is no allowance to revoke and no external account to drain.
///
///  - execute() IS PERMISSIONLESS. Anyone can call it. Our keeper or cron runner
///    normally does, but if the backend dies, the treasurer or any bystander can
///    still enforce the rule. That is the point.
///
///  - NO AI IS INVOLVED HERE. An AI chose the floor, destination domain, and
///    recipient once, at setup, before this contract existed. From deployment
///    onward the behaviour is fixed and readable.
///
///  - ALL ARITHMETIC IS 6 DECIMALS, via the USDC ERC-20 precompile. On Arc, USDC
///    has one balance behind two interfaces: native (18d, arrives as msg.value)
///    and this precompile (6d). receive() exists purely so native-interface
///    payers do not revert.
///
///  - The contract calls TokenMessengerV2.depositForBurn directly. No backend
///    wallet in the money path. The offchain attestation + mint is a separate
///    script that does not touch this contract.
contract BridgeRule {
    /// USDC ERC-20 precompile on Arc. 6 decimals.
    IUSDC public constant USDC = IUSDC(0x3600000000000000000000000000000000000000);

    /// CCTP V2 TokenMessenger on Arc testnet.
    ITokenMessengerV2 public constant TOKEN_MESSENGER =
        ITokenMessengerV2(0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA);

    /// Standard finality threshold. Arc has no Fast Transfer.
    uint32 private constant STANDARD_FINALITY = 2000;

    /// CCTP destination domain for Base Sepolia.
    uint32 public immutable destinationDomain;

    /// Recipient on the destination chain, padded to bytes32.
    bytes32 public immutable mintRecipient;

    /// Balance floor in 6 decimals. Surplus above this is bridged.
    uint256 public immutable floor;

    /// Minimum seconds between bridges. "Monthly" in a sentence becomes a number
    /// here, enforced by the contract rather than promised by the keeper.
    uint64 public immutable minInterval;

    /// The treasurer, allowed to withdraw the working balance.
    address public immutable owner;

    /// Timestamp of the last bridge. Zero means never executed, so the first
    /// bridge is allowed immediately once there is a surplus.
    uint64 public lastExecutedAt;

    event RuleExecuted(uint256 surplus, uint256 bridged);
    event Withdrawn(address indexed to, uint256 amount);
    event Deposited(address indexed from, uint256 nativeValue);

    error NothingToBridge();
    error TooSoon(uint64 nextAllowedAt);
    error NotOwner();
    error InvalidAddress();
    error InvalidFloor();
    error InvalidDomain();
    error TransferFailed();
    error ApproveFailed();

    constructor(
        uint32 _destinationDomain,
        bytes32 _mintRecipient,
        uint256 _floor,
        uint64 _minInterval,
        address _owner
    ) {
        if (_owner == address(0)) revert InvalidAddress();
        if (_mintRecipient == bytes32(0)) revert InvalidAddress();
        if (_floor == 0) revert InvalidFloor();
        // Domain 26 is Arc itself. Burning with nowhere to mint would destroy
        // the funds, so it is refused at construction.
        if (_destinationDomain == 26) revert InvalidDomain();
        destinationDomain = _destinationDomain;
        mintRecipient = _mintRecipient;
        floor = _floor;
        minInterval = _minInterval;
        owner = _owner;
    }

    /// @notice Accept native-interface USDC. Without this, such payments revert.
    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Current surplus above the floor, in 6 decimals.
    function surplusAmount() public view returns (uint256) {
        uint256 balance = USDC.balanceOf(address(this));
        return balance > floor ? balance - floor : 0;
    }

    /// @notice Timestamp when the next bridge becomes allowed. Zero before the
    ///         first execution, meaning "allowed now".
    function nextAllowedAt() public view returns (uint64) {
        return lastExecutedAt == 0 ? 0 : lastExecutedAt + minInterval;
    }

    /// @notice True when both the floor and the schedule permit a bridge.
    function isReady() public view returns (bool) {
        return surplusAmount() > 0 && block.timestamp >= nextAllowedAt();
    }

    /// @notice Bridge the surplus above the floor via CCTP V2.
    /// @dev Permissionless by design, same as SplitRule.execute().
    ///      BOTH conditions are enforced here, not by the keeper: the floor and
    ///      the interval. A keeper poking this in a loop achieves nothing but
    ///      wasted gas, so the cadence in the treasurer's sentence is a property
    ///      of the contract rather than a promise from our backend.
    ///      maxFee 0 is accepted on Arc (verified in the spike, test S5).
    function execute() external {
        uint256 surplus = surplusAmount();
        if (surplus == 0) revert NothingToBridge();

        uint64 allowedAt = nextAllowedAt();
        if (block.timestamp < allowedAt) revert TooSoon(allowedAt);

        // Effects before interactions.
        lastExecutedAt = uint64(block.timestamp);

        // Approve the exact amount for this burn. No persistent allowance.
        if (!USDC.approve(address(TOKEN_MESSENGER), surplus)) revert ApproveFailed();

        TOKEN_MESSENGER.depositForBurn(
            surplus,
            destinationDomain,
            mintRecipient,
            address(USDC),
            bytes32(0),     // destinationCaller: open, anyone can relay
            0,              // maxFee: 0 accepted on Arc (no minimum)
            STANDARD_FINALITY
        );

        emit RuleExecuted(surplus, surplus);
    }

    /// @notice Treasurer withdraws from the balance.
    /// @param amount Amount in 6 decimals.
    function withdraw(address to, uint256 amount) external {
        if (msg.sender != owner) revert NotOwner();
        if (to == address(0)) revert InvalidAddress();
        if (!USDC.transfer(to, amount)) revert TransferFailed();
        emit Withdrawn(to, amount);
    }

    /// @notice Everything a UI needs in one call.
    function ruleState()
        external
        view
        returns (
            uint32 destinationDomain_,
            bytes32 mintRecipient_,
            uint256 floor_,
            uint256 balance_,
            uint256 surplus_,
            uint64 nextAllowedAt_,
            bool ready_
        )
    {
        return (
            destinationDomain,
            mintRecipient,
            floor,
            USDC.balanceOf(address(this)),
            surplusAmount(),
            nextAllowedAt(),
            isReady()
        );
    }
}
