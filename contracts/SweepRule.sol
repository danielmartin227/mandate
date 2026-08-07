// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IUSDC {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title SweepRule
/// @notice A standing treasury rule: whenever the USDC balance exceeds a floor,
///         sweep the surplus to a designated address.
///
/// @dev Design notes that matter:
///
///  - THIS CONTRACT IS THE TREASURY. Payments are sent directly to this address.
///
///  - execute() IS PERMISSIONLESS. Our cron runner normally calls it on schedule,
///    but anyone can call it at any time. Two callers racing: the second sees no
///    surplus and reverts with NothingToSweep.
///
///  - NO AI IS INVOLVED HERE. An AI chose the floor and destination once, at
///    setup. From deployment onward the behaviour is fixed and readable.
///
///  - ALL ARITHMETIC IS 6 DECIMALS, via the USDC ERC-20 precompile. On Arc, USDC
///    has one balance behind two interfaces: native (18d, arrives as msg.value)
///    and this precompile (6d). receive() exists purely so native-interface
///    payers do not revert.
contract SweepRule {
    /// USDC ERC-20 precompile on Arc. 6 decimals.
    IUSDC public constant USDC = IUSDC(0x3600000000000000000000000000000000000000);

    /// Where the surplus goes. Fixed at deployment.
    address public immutable destination;

    /// Balance floor in 6 decimals. Everything above this is swept.
    uint256 public immutable floor;

    /// The treasurer, allowed to withdraw from the working balance.
    address public immutable owner;

    /// Total swept since deployment (6 decimals). Monotonically increasing.
    uint256 public totalSwept;

    event RuleExecuted(uint256 surplus, uint256 swept);
    event Withdrawn(address indexed to, uint256 amount);
    event Deposited(address indexed from, uint256 nativeValue);

    error NothingToSweep();
    error NotOwner();
    error InvalidAddress();
    error InvalidFloor();
    error TransferFailed();

    constructor(address _destination, uint256 _floor, address _owner) {
        if (_destination == address(0) || _owner == address(0)) revert InvalidAddress();
        if (_floor == 0) revert InvalidFloor();
        destination = _destination;
        floor = _floor;
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

    /// @notice Sweep all surplus above the floor to the destination.
    /// @dev Permissionless by design, same as SplitRule.execute().
    function execute() external {
        uint256 surplus = surplusAmount();
        if (surplus == 0) revert NothingToSweep();

        totalSwept += surplus;

        if (!USDC.transfer(destination, surplus)) revert TransferFailed();

        emit RuleExecuted(surplus, surplus);
    }

    /// @notice Treasurer withdraws from the balance (including the floor).
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
            address destination_,
            uint256 floor_,
            uint256 balance_,
            uint256 surplus_,
            uint256 totalSwept_
        )
    {
        return (
            destination,
            floor,
            USDC.balanceOf(address(this)),
            surplusAmount(),
            totalSwept
        );
    }
}
