// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IMilestoneVerifier {
    function isMilestoneApproved(address campaign, uint256 milestoneId) external view returns (bool);
}

interface IRevenueSharing {
    function notifyContribution(address backer, uint256 amount) external;
    function depositRevenue() external payable;
    function claimForCampaign(address campaign, address backer) external returns (uint256);
}

interface IBackerNFT {
    function mint(address to, string calldata uri) external returns (uint256);
}

interface IImpactNFT {
    function mint(address to, string calldata uri) external returns (uint256);
}

contract CampaignEscrow is ReentrancyGuard {
    struct Milestone {
        uint256 amount;
        bool released;
    }

    address public immutable creator;
    address public immutable governance;
    address payable public immutable treasury;
    address public immutable verifier;
    address public immutable revenueSharing;
    address public immutable backerNFT;
    address public immutable impactNFT;
    uint256 public immutable feeBps;
    string public metadataURI;

    bool public donationsPaused;
    uint256 public totalGrossDonations;
    uint256 public totalNetContributions;
    uint256 public totalReleasedToCreator;
    uint256 public totalFeePaid;
    uint256 public totalBackers;
    uint256 public nextMilestoneToRelease;

    Milestone[] public milestones;
    mapping(address backer => uint256 contributedNet) public contributions;

    event DonationReceived(address indexed donor, uint256 grossAmount, uint256 feeAmount, uint256 netAmount);
    event MilestoneReleased(uint256 indexed milestoneId, uint256 amount, address indexed creator);
    event RevenueDeposited(address indexed creator, uint256 amount);
    event DonationsPauseUpdated(bool paused, address indexed operator);

    modifier onlyCreator() {
        require(msg.sender == creator, "Only creator");
        _;
    }

    modifier onlyCreatorOrGovernance() {
        require(msg.sender == creator || msg.sender == governance, "Not authorized");
        _;
    }

    constructor(
        address _creator,
        address _governance,
        address payable _treasury,
        address _verifier,
        address _revenueSharing,
        address _backerNFT,
        address _impactNFT,
        uint256 _feeBps,
        uint256[] memory milestoneAmounts,
        string memory _metadataURI
    ) {
        require(_creator != address(0), "Invalid creator");
        require(_governance != address(0), "Invalid governance");
        require(_treasury != address(0), "Invalid treasury");
        require(_verifier != address(0), "Invalid verifier");
        require(_revenueSharing != address(0), "Invalid revenue");
        require(_feeBps <= 1_000, "Fee too high");
        require(milestoneAmounts.length > 0, "No milestones");

        creator = _creator;
        governance = _governance;
        treasury = _treasury;
        verifier = _verifier;
        revenueSharing = _revenueSharing;
        backerNFT = _backerNFT;
        impactNFT = _impactNFT;
        feeBps = _feeBps;
        metadataURI = _metadataURI;

        for (uint256 i = 0; i < milestoneAmounts.length; i++) {
            uint256 amount = milestoneAmounts[i];
            require(amount > 0, "Invalid milestone amount");
            milestones.push(Milestone({amount: amount, released: false}));
        }
    }

    function donate() external payable nonReentrant {
        require(!donationsPaused, "Donations paused");
        require(nextMilestoneToRelease < milestones.length, "Campaign completed");
        require(msg.value > 0, "Amount must be > 0");

        uint256 feeAmount = (msg.value * feeBps) / 10_000;
        uint256 netAmount = msg.value - feeAmount;
        require(netAmount > 0, "Net amount is zero");

        if (contributions[msg.sender] == 0) {
            totalBackers += 1;
            if (backerNFT != address(0)) {
                try IBackerNFT(backerNFT).mint(msg.sender, "") {} catch {}
            }
        }

        contributions[msg.sender] += netAmount;
        totalGrossDonations += msg.value;
        totalNetContributions += netAmount;
        totalFeePaid += feeAmount;

        IRevenueSharing(revenueSharing).notifyContribution(msg.sender, netAmount);

        if (feeAmount > 0) {
            (bool feeSent, ) = treasury.call{value: feeAmount}("");
            require(feeSent, "Fee transfer failed");
        }

        emit DonationReceived(msg.sender, msg.value, feeAmount, netAmount);
    }

    function releaseMilestone(uint256 milestoneId) external nonReentrant onlyCreatorOrGovernance {
        require(milestoneId == nextMilestoneToRelease, "Milestone out of order");
        require(milestoneId < milestones.length, "Invalid milestone");
        require(IMilestoneVerifier(verifier).isMilestoneApproved(address(this), milestoneId), "Milestone not approved");

        Milestone storage milestone = milestones[milestoneId];
        require(!milestone.released, "Milestone already released");
        require(totalReleasedToCreator + milestone.amount <= totalNetContributions, "Insufficient escrow balance");

        milestone.released = true;
        nextMilestoneToRelease += 1;
        totalReleasedToCreator += milestone.amount;

        (bool sent, ) = payable(creator).call{value: milestone.amount}("");
        require(sent, "Creator payout failed");

        if (nextMilestoneToRelease == milestones.length && impactNFT != address(0)) {
            try IImpactNFT(impactNFT).mint(creator, metadataURI) {} catch {}
        }

        emit MilestoneReleased(milestoneId, milestone.amount, creator);
    }

    function depositRevenue() external payable nonReentrant onlyCreator {
        require(msg.value > 0, "No revenue");
        IRevenueSharing(revenueSharing).depositRevenue{value: msg.value}();
        emit RevenueDeposited(msg.sender, msg.value);
    }

    function claimRevenue() external nonReentrant returns (uint256 amount) {
        amount = IRevenueSharing(revenueSharing).claimForCampaign(address(this), msg.sender);
    }

    function setDonationsPaused(bool paused) external onlyCreatorOrGovernance {
        donationsPaused = paused;
        emit DonationsPauseUpdated(paused, msg.sender);
    }

    function milestoneCount() external view returns (uint256) {
        return milestones.length;
    }
}
