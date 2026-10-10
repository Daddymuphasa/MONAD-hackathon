// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Papagedon Visual Memory
/// @notice Testnet ERC-721 storing declarative visual recipes and user-approved preference memory.
/// @dev The visualCode field is data interpreted by a versioned Papagedon renderer, not executable code.
contract PapagedonVisualMemory is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 public constant MAX_VISUAL_CODE_BYTES = 8_192;
    uint256 public constant MAX_TASTE_PROFILE_BYTES = 4_096;

    struct VisualMemory {
        string visualCode;
        string tasteProfile;
        bytes32 contentHash;
        uint32 rendererVersion;
        uint64 mintedAt;
        uint64 updatedAt;
    }

    uint256 public mintPrice;
    uint256 private nextTokenId = 1;
    mapping(uint256 tokenId => VisualMemory memoryData) private memories;

    error IncorrectMintPayment(uint256 expected, uint256 received);
    error EmptyVisualCode();
    error VisualCodeTooLarge();
    error TasteProfileTooLarge();
    error InvalidContentHash();
    error NotTokenController();
    error WithdrawalFailed();

    event MemoryMinted(
        uint256 indexed tokenId,
        address indexed owner,
        bytes32 indexed contentHash,
        uint32 rendererVersion
    );
    event MemoryUpdated(
        uint256 indexed tokenId,
        bytes32 indexed contentHash,
        uint32 rendererVersion
    );
    event MintPriceUpdated(uint256 previousPrice, uint256 newPrice);

    constructor(uint256 initialMintPrice)
        ERC721("Papagedon Visual Memory", "PVM")
        Ownable(msg.sender)
    {
        mintPrice = initialMintPrice;
    }

    function mintMemory(
        string calldata metadataUri,
        string calldata visualCode,
        string calldata tasteProfile,
        bytes32 contentHash,
        uint32 rendererVersion
    ) external payable nonReentrant returns (uint256 tokenId) {
        if (msg.value != mintPrice) revert IncorrectMintPayment(mintPrice, msg.value);
        _validateMemory(visualCode, tasteProfile, contentHash);

        tokenId = nextTokenId++;
        uint64 timestamp = uint64(block.timestamp);
        memories[tokenId] = VisualMemory({
            visualCode: visualCode,
            tasteProfile: tasteProfile,
            contentHash: contentHash,
            rendererVersion: rendererVersion,
            mintedAt: timestamp,
            updatedAt: timestamp
        });

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataUri);
        emit MemoryMinted(tokenId, msg.sender, contentHash, rendererVersion);
    }

    function updateMemory(
        uint256 tokenId,
        string calldata metadataUri,
        string calldata visualCode,
        string calldata tasteProfile,
        bytes32 contentHash,
        uint32 rendererVersion
    ) external {
        if (!_isAuthorized(ownerOf(tokenId), msg.sender, tokenId)) revert NotTokenController();
        _validateMemory(visualCode, tasteProfile, contentHash);

        VisualMemory storage memoryData = memories[tokenId];
        memoryData.visualCode = visualCode;
        memoryData.tasteProfile = tasteProfile;
        memoryData.contentHash = contentHash;
        memoryData.rendererVersion = rendererVersion;
        memoryData.updatedAt = uint64(block.timestamp);
        _setTokenURI(tokenId, metadataUri);

        emit MemoryUpdated(tokenId, contentHash, rendererVersion);
    }

    function getMemory(uint256 tokenId) external view returns (VisualMemory memory) {
        ownerOf(tokenId);
        return memories[tokenId];
    }

    function totalMinted() external view returns (uint256) {
        return nextTokenId - 1;
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        uint256 previousPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceUpdated(previousPrice, newPrice);
    }

    function withdraw(address payable recipient) external onlyOwner nonReentrant {
        (bool success,) = recipient.call{value: address(this).balance}("");
        if (!success) revert WithdrawalFailed();
    }

    function _validateMemory(
        string calldata visualCode,
        string calldata tasteProfile,
        bytes32 contentHash
    ) private pure {
        uint256 visualCodeLength = bytes(visualCode).length;
        if (visualCodeLength == 0) revert EmptyVisualCode();
        if (visualCodeLength > MAX_VISUAL_CODE_BYTES) revert VisualCodeTooLarge();
        if (bytes(tasteProfile).length > MAX_TASTE_PROFILE_BYTES) revert TasteProfileTooLarge();
        if (contentHash == bytes32(0)) revert InvalidContentHash();
    }
}
