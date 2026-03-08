// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../escrow/CampaignEscrow.sol";

interface IRevenueRegistrar {
    function registerCampaign(address campaign) external;
}

interface IRoleManagedNft {
    function MINTER_ROLE() external view returns (bytes32);
    function grantRole(bytes32 role, address account) external;
}

contract ColmenaFactory is AccessControl, ReentrancyGuard {
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    struct CampaignRecord {
        address campaign;
        address creator;
        string metadataURI;
        uint256 createdAt;
    }

    address public governanceExecutor;
    address payable public treasury;
    address public verifier;
    address public revenueSharing;
    address public backerNFT;
    address public impactNFT;
    uint256 public platformFeeBps;

    CampaignRecord[] private _campaigns;

    event CampaignCreated(address indexed campaign, address indexed creator, uint256 indexed campaignId, string metadataURI);
    event ProtocolAddressesUpdated(
        address indexed governanceExecutor,
        address indexed treasury,
        address indexed verifier,
        address revenueSharing,
        address backerNFT,
        address impactNFT
    );
    event PlatformFeeUpdated(uint256 feeBps);

    constructor(
        address admin,
        address _governanceExecutor,
        address payable _treasury,
        address _verifier,
        address _revenueSharing,
        address _backerNFT,
        address _impactNFT,
        uint256 _platformFeeBps
    ) {
        require(admin != address(0), "Invalid admin");
        _validateAddresses(_governanceExecutor, _treasury, _verifier, _revenueSharing);
        require(_platformFeeBps <= 1_000, "Fee too high");

        governanceExecutor = _governanceExecutor;
        treasury = _treasury;
        verifier = _verifier;
        revenueSharing = _revenueSharing;
        backerNFT = _backerNFT;
        impactNFT = _impactNFT;
        platformFeeBps = _platformFeeBps;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GOVERNANCE_ROLE, admin);
    }

    function createCampaign(uint256[] calldata milestoneAmounts, string calldata metadataURI)
        external
        nonReentrant
        returns (address campaign)
    {
        require(milestoneAmounts.length > 0, "No milestones");

        CampaignEscrow deployed = new CampaignEscrow(
            msg.sender,
            governanceExecutor,
            treasury,
            verifier,
            revenueSharing,
            backerNFT,
            impactNFT,
            platformFeeBps,
            milestoneAmounts,
            metadataURI
        );

        campaign = address(deployed);
        IRevenueRegistrar(revenueSharing).registerCampaign(campaign);
        _grantNftMinterRole(campaign);

        _campaigns.push(
            CampaignRecord({campaign: campaign, creator: msg.sender, metadataURI: metadataURI, createdAt: block.timestamp})
        );

        emit CampaignCreated(campaign, msg.sender, _campaigns.length - 1, metadataURI);
    }

    function updateProtocolAddresses(
        address _governanceExecutor,
        address payable _treasury,
        address _verifier,
        address _revenueSharing,
        address _backerNFT,
        address _impactNFT
    ) external onlyRole(GOVERNANCE_ROLE) {
        _validateAddresses(_governanceExecutor, _treasury, _verifier, _revenueSharing);
        governanceExecutor = _governanceExecutor;
        treasury = _treasury;
        verifier = _verifier;
        revenueSharing = _revenueSharing;
        backerNFT = _backerNFT;
        impactNFT = _impactNFT;

        emit ProtocolAddressesUpdated(_governanceExecutor, _treasury, _verifier, _revenueSharing, _backerNFT, _impactNFT);
    }

    function updatePlatformFee(uint256 feeBps) external onlyRole(GOVERNANCE_ROLE) {
        require(feeBps <= 1_000, "Fee too high");
        platformFeeBps = feeBps;
        emit PlatformFeeUpdated(feeBps);
    }

    function campaignCount() external view returns (uint256) {
        return _campaigns.length;
    }

    function campaignAt(uint256 index) external view returns (CampaignRecord memory) {
        return _campaigns[index];
    }

    function _validateAddresses(
        address _governanceExecutor,
        address payable _treasury,
        address _verifier,
        address _revenueSharing
    ) private pure {
        require(_governanceExecutor != address(0), "Invalid governance");
        require(_treasury != address(0), "Invalid treasury");
        require(_verifier != address(0), "Invalid verifier");
        require(_revenueSharing != address(0), "Invalid revenue sharing");
    }

    function _grantNftMinterRole(address campaign) private {
        if (backerNFT != address(0)) {
            bytes32 backerMinterRole = IRoleManagedNft(backerNFT).MINTER_ROLE();
            IRoleManagedNft(backerNFT).grantRole(backerMinterRole, campaign);
        }
        if (impactNFT != address(0)) {
            bytes32 impactMinterRole = IRoleManagedNft(impactNFT).MINTER_ROLE();
            IRoleManagedNft(impactNFT).grantRole(impactMinterRole, campaign);
        }
    }
}
