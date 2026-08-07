// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IUSDC {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title SplitRule
/// @notice A standing treasury rule: route a fixed share of every incoming USDC
///         payment to a savings address. The rest stays here as working treasury.
///
/// @dev Design notes that matter:
///
///  - THIS CONTRACT IS THE TREASURY. Payments are sent directly to this address.
///    There is no allowance to revoke and no external account to drain.
///
///  - execute() IS PERMISSIONLESS. Anyone can call it. Our keeper normally does,
///    but if the keeper dies, the treasurer or any bystander can still enforce
///    the rule. That is the point: the rule does not depend on us being alive.
///
///  - NO AI IS INVOLVED HERE. An AI chose `savingsBps` once, at setup, before this
///    contract existed. From deployment onward the behaviour is fixed and readable.
///
///  - ALL ARITHMETIC IS 6 DECIMALS, via the USDC ERC-20 precompile. On Arc, USDC
///    has one balance behind two interfaces: native (18d, arrives as msg.value)
///    and this precompile (6d). Mixing them miscalculates by 10^12, so the native
///    interface is never read here. receive() exists purely so native-interface
///    payers do not revert; their funds show up in the precompile balance anyway.
contract SplitRule {
    /// USDC ERC-20 precompile on Arc. 6 decimals.
    IUSDC public constant USDC = IUSDC(0x3600000000000000000000000000000000000000);

    uint256 private constant BPS_DENOMINATOR = 10_000;

    /// Where the savings share goes. Fixed at deployment.
    address public immutable savings;

    /// Share of each incoming payment routed to savings, in basis points.
    uint16 public immutable savingsBps;

    /// The treasurer, allowed to withdraw the working balance.
    address public immutable owner;

    /// Balance already accounted for by a previous execute() or withdraw().
    /// Anything above this is a new deposit awaiting the split.
    uint256 public processedBalance;

    event RuleExecuted(uint256 incoming, uint256 routedToSavings, uint256 remaining);
    event Withdrawn(address indexed to, uint256 amount);
    event Deposited(address indexed from, uint256 nativeValue);

    error NothingToSplit();
    error ShareRoundsToZero();
    error NotOwner();
    error InsufficientWorkingBalance();
    error InvalidBps();
    error InvalidAddress();
    error TransferFailed();

    constructor(address _savings, uint16 _savingsBps, address _owner) {
        // Zero-address transfers revert on Arc, so a zero savings address would
        // brick every execute(). Reject it at construction instead.
        if (_savings == address(0) || _owner == address(0)) revert InvalidAddress();
        if (_savingsBps == 0 || _savingsBps > BPS_DENOMINATOR) revert InvalidBps();
        savings = _savings;
        savingsBps = _savingsBps;
        owner = _owner;
    }

    /// @notice Accept native-interface USDC. Without this, such payments revert.
    /// @dev msg.value is 18 decimals and is deliberately NOT used in any accounting.
    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Amount deposited since the last execute(), in 6 decimals.
    function pendingAmount() public view returns (uint256) {
        uint256 balance = USDC.balanceOf(address(this));
        return balance > processedBalance ? balance - processedBalance : 0;
    }

    /// @notice Split every payment received since the last call.
    /// @dev Permissionless by design. Batches multiple deposits into one split,
    ///      which is arithmetically identical to splitting each one separately
    ///      except for rounding, which always favours the treasury.
    function execute() external {
        uint256 incoming = pendingAmount();
        if (incoming == 0) revert NothingToSplit();

        uint256 routed = (incoming * savingsBps) / BPS_DENOMINATOR;
        // Dust deposits can round to zero. Reverting leaves them pending to be
        // swept up by the next, larger deposit rather than silently vanishing.
        if (routed == 0) revert ShareRoundsToZero();

        // Effects before interaction: the balance after this transfer is exactly
        // what remains accounted for.
        uint256 balanceAfter = USDC.balanceOf(address(this)) - routed;
        processedBalance = balanceAfter;

        if (!USDC.transfer(savings, routed)) revert TransferFailed();

        emit RuleExecuted(incoming, routed, balanceAfter);
    }

    /// @notice Treasurer withdraws from the working balance.
    /// @param amount Amount in 6 decimals.
    function withdraw(address to, uint256 amount) external {
        if (msg.sender != owner) revert NotOwner();
        if (to == address(0)) revert InvalidAddress();
        // Only the already-split working balance is withdrawable. Funds awaiting
        // a split cannot be pulled out ahead of the rule.
        if (amount > processedBalance) revert InsufficientWorkingBalance();

        processedBalance -= amount;
        if (!USDC.transfer(to, amount)) revert TransferFailed();
        emit Withdrawn(to, amount);
    }

    /// @notice Everything a UI needs in one call.
    function ruleState()
        external
        view
        returns (
            address savings_,
            uint16 savingsBps_,
            uint256 balance_,
            uint256 pending_,
            uint256 processed_
        )
    {
        return (
            savings,
            savingsBps,
            USDC.balanceOf(address(this)),
            pendingAmount(),
            processedBalance
        );
    }
}
