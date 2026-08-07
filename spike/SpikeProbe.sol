// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IUSDC {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @notice Throwaway probe for spike tests S2 and S3.
/// Answers three questions the real templates depend on:
///  1. Does a contract need receive() to accept native-interface USDC on Arc? (expect yes)
///  2. Does the 6-decimal ERC-20 precompile see funds that arrived through the 18-decimal
///     native interface? (Arc claims one balance behind two interfaces)
///  3. Can a contract move USDC out through the precompile?
contract SpikeProbe {
    /// USDC ERC-20 precompile, 6 decimals, same balance as the native interface.
    IUSDC public constant USDC = IUSDC(0x3600000000000000000000000000000000000000);

    event Received(address indexed from, uint256 value);
    event SweptOut(address indexed to, uint256 amount6);

    /// Native-interface USDC arrives as msg.value. Without this the transfer reverts.
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    /// Balance as reported by the 6-decimal precompile.
    function erc20Balance() external view returns (uint256) {
        return USDC.balanceOf(address(this));
    }

    /// Balance as reported by the 18-decimal native interface.
    function nativeBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// Move USDC out through the precompile. Amount is in 6 decimals.
    function sweepTo(address to, uint256 amount6) external {
        require(USDC.transfer(to, amount6), "transfer failed");
        emit SweptOut(to, amount6);
    }
}
