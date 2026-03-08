// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TreasuryVault is AccessControl, ReentrancyGuard {
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

    event FeeReceived(address indexed sender, uint256 amount);
    event FundsWithdrawn(address indexed recipient, uint256 amount, string reason);
    event GrantIssued(address indexed recipient, uint256 amount, string reason);

    constructor(address admin) {
        require(admin != address(0), "Invalid admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(TREASURER_ROLE, admin);
    }

    receive() external payable {
        emit FeeReceived(msg.sender, msg.value);
    }

    function withdraw(address payable recipient, uint256 amount, string calldata reason)
        external
        onlyRole(TREASURER_ROLE)
        nonReentrant
    {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(amount <= address(this).balance, "Insufficient treasury balance");

        (bool ok, ) = recipient.call{value: amount}("");
        require(ok, "Transfer failed");

        emit FundsWithdrawn(recipient, amount, reason);
    }

    function issueGrant(address payable recipient, uint256 amount, string calldata reason)
        external
        onlyRole(TREASURER_ROLE)
        nonReentrant
    {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(amount <= address(this).balance, "Insufficient treasury balance");

        (bool ok, ) = recipient.call{value: amount}("");
        require(ok, "Transfer failed");

        emit GrantIssued(recipient, amount, reason);
    }
}
