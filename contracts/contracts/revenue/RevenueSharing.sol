// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RevenueSharing is AccessControl, ReentrancyGuard {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    struct CampaignState {
        uint256 totalContributions;
        uint256 totalRevenue;
    }

    mapping(address campaign => bool registered) public isCampaignRegistered;
    mapping(address campaign => CampaignState state) public campaignState;
    mapping(address campaign => mapping(address backer => uint256 amount)) public contributions;
    mapping(address campaign => mapping(address backer => uint256 amount)) public claimed;

    event CampaignRegistered(address indexed campaign);
    event ContributionNotified(address indexed campaign, address indexed backer, uint256 amount);
    event RevenueDeposited(address indexed campaign, uint256 amount);
    event RevenueClaimed(address indexed campaign, address indexed backer, uint256 amount);

    modifier onlyCampaign() {
        require(isCampaignRegistered[msg.sender], "Unregistered campaign");
        _;
    }

    constructor(address admin) {
        require(admin != address(0), "Invalid admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRAR_ROLE, admin);
    }

    function registerCampaign(address campaign) external onlyRole(REGISTRAR_ROLE) {
        require(campaign != address(0), "Invalid campaign");
        require(!isCampaignRegistered[campaign], "Campaign already registered");
        isCampaignRegistered[campaign] = true;
        emit CampaignRegistered(campaign);
    }

    function notifyContribution(address backer, uint256 amount) external onlyCampaign {
        require(backer != address(0), "Invalid backer");
        require(amount > 0, "Amount must be > 0");
        campaignState[msg.sender].totalContributions += amount;
        contributions[msg.sender][backer] += amount;
        emit ContributionNotified(msg.sender, backer, amount);
    }

    function depositRevenue() external payable onlyCampaign {
        require(msg.value > 0, "No revenue");
        campaignState[msg.sender].totalRevenue += msg.value;
        emit RevenueDeposited(msg.sender, msg.value);
    }

    function claimForCampaign(address campaign, address backer) external nonReentrant returns (uint256 amount) {
        require(campaign != address(0), "Invalid campaign");
        require(backer != address(0), "Invalid backer");
        require(msg.sender == backer || msg.sender == campaign, "Not authorized");

        amount = claimable(campaign, backer);
        require(amount > 0, "Nothing to claim");

        claimed[campaign][backer] += amount;
        (bool ok, ) = payable(backer).call{value: amount}("");
        require(ok, "Transfer failed");

        emit RevenueClaimed(campaign, backer, amount);
    }

    function claimable(address campaign, address backer) public view returns (uint256) {
        uint256 totalContributions = campaignState[campaign].totalContributions;
        if (totalContributions == 0) return 0;

        uint256 contributed = contributions[campaign][backer];
        if (contributed == 0) return 0;

        uint256 entitled = (campaignState[campaign].totalRevenue * contributed) / totalContributions;
        uint256 alreadyClaimed = claimed[campaign][backer];
        if (entitled <= alreadyClaimed) return 0;

        return entitled - alreadyClaimed;
    }
}
