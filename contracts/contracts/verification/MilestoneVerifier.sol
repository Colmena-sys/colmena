// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract MilestoneVerifier is AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    mapping(address campaign => mapping(uint256 milestoneId => bool approved)) private _approvals;
    mapping(address campaign => mapping(uint256 milestoneId => string evidenceURI)) private _evidence;

    event MilestoneApproved(address indexed campaign, uint256 indexed milestoneId, address indexed verifier, string evidenceURI);
    event MilestoneRevoked(address indexed campaign, uint256 indexed milestoneId, address indexed verifier);

    constructor(address admin) {
        require(admin != address(0), "Invalid admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(VERIFIER_ROLE, admin);
    }

    function approveMilestone(address campaign, uint256 milestoneId, string calldata evidenceURI) external onlyRole(VERIFIER_ROLE) {
        require(campaign != address(0), "Invalid campaign");
        _approvals[campaign][milestoneId] = true;
        _evidence[campaign][milestoneId] = evidenceURI;
        emit MilestoneApproved(campaign, milestoneId, msg.sender, evidenceURI);
    }

    function revokeMilestone(address campaign, uint256 milestoneId) external onlyRole(VERIFIER_ROLE) {
        require(campaign != address(0), "Invalid campaign");
        _approvals[campaign][milestoneId] = false;
        delete _evidence[campaign][milestoneId];
        emit MilestoneRevoked(campaign, milestoneId, msg.sender);
    }

    function isMilestoneApproved(address campaign, uint256 milestoneId) external view returns (bool) {
        return _approvals[campaign][milestoneId];
    }

    function milestoneEvidence(address campaign, uint256 milestoneId) external view returns (string memory) {
        return _evidence[campaign][milestoneId];
    }
}
