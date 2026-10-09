// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Papageddon Monad Experience Registry
/// @notice Anchors generated Papageddon visual packs and listening sessions.
contract PapageddonMonadExperienceRegistry {
    struct Experience {
        address creator;
        bytes32 metadataHash;
        string metadataUri;
        string title;
        string packId;
        uint256 paidAmount;
        uint64 createdAt;
    }

    Experience[] private experiences;
    mapping(address => uint256[]) private experiencesByCreator;

    event ExperienceRegistered(
        uint256 indexed experienceId,
        address indexed creator,
        bytes32 indexed metadataHash,
        string metadataUri,
        string title,
        string packId,
        uint256 paidAmount
    );

    function registerExperience(
        bytes32 metadataHash,
        string calldata metadataUri,
        string calldata title,
        string calldata packId
    ) external payable returns (uint256 experienceId) {
        require(metadataHash != bytes32(0), "metadata hash required");
        require(bytes(metadataUri).length != 0, "metadata uri required");
        require(bytes(title).length != 0, "title required");
        require(bytes(packId).length != 0, "pack id required");

        experienceId = experiences.length;
        experiences.push(
            Experience({
                creator: msg.sender,
                metadataHash: metadataHash,
                metadataUri: metadataUri,
                title: title,
                packId: packId,
                paidAmount: msg.value,
                createdAt: uint64(block.timestamp)
            })
        );

        experiencesByCreator[msg.sender].push(experienceId);

        emit ExperienceRegistered(
            experienceId,
            msg.sender,
            metadataHash,
            metadataUri,
            title,
            packId,
            msg.value
        );
    }

    function experienceCount() external view returns (uint256) {
        return experiences.length;
    }

    function creatorExperienceCount(address creator) external view returns (uint256) {
        return experiencesByCreator[creator].length;
    }

    function experienceIdForCreator(address creator, uint256 index)
        external
        view
        returns (uint256)
    {
        require(index < experiencesByCreator[creator].length, "unknown creator index");
        return experiencesByCreator[creator][index];
    }

    function getExperience(uint256 experienceId)
        external
        view
        returns (Experience memory)
    {
        require(experienceId < experiences.length, "unknown experience");
        return experiences[experienceId];
    }
}

