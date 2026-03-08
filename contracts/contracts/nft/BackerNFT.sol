// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract BackerNFT is ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public nextTokenId;

    constructor(address admin) ERC721("Colmena Backer NFT", "cBACK") {
        require(admin != address(0), "Invalid admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    function mint(address to, string calldata uri) external onlyRole(MINTER_ROLE) returns (uint256 tokenId) {
        require(to != address(0), "Invalid recipient");
        tokenId = nextTokenId++;
        _safeMint(to, tokenId);
        if (bytes(uri).length > 0) {
            _setTokenURI(tokenId, uri);
        }
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
