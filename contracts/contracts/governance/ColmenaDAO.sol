// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ColmenaDAO is AccessControl, ReentrancyGuard {
    bytes32 public constant DAO_MEMBER_ROLE = keccak256("DAO_MEMBER_ROLE");

    event DaoActionExecuted(address indexed target, uint256 value, bytes data, bytes result);

    constructor(address admin) {
        require(admin != address(0), "Invalid admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(DAO_MEMBER_ROLE, admin);
    }

    function execute(address target, uint256 value, bytes calldata data)
        external
        onlyRole(DAO_MEMBER_ROLE)
        nonReentrant
        returns (bytes memory result)
    {
        require(target != address(0), "Invalid target");
        (bool ok, bytes memory response) = target.call{value: value}(data);
        require(ok, "DAO execution failed");
        emit DaoActionExecuted(target, value, data, response);
        return response;
    }

    receive() external payable {}
}
