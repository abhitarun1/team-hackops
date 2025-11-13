// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IDIDRegistry
 * @dev Interface for DID Registry contract
 */
interface IDIDRegistry {
    struct DIDDocument {
        string id;
        string[] context;
        string[] controller;
        string[] publicKey;
        string[] service;
        uint256 created;
        uint256 updated;
        bool exists;
    }

    function createDID(
        string memory did,
        string[] memory context,
        string[] memory publicKeys,
        string[] memory services
    ) external;

    function resolveDID(string memory did) external view returns (DIDDocument memory);

    function didExists(string memory did) external view returns (bool);

    function updateDID(
        string memory did,
        string[] memory context,
        string[] memory publicKeys,
        string[] memory services
    ) external;

    function addController(string memory did, address controller) external;

    function removeController(string memory did, address controller) external;

    function deactivateDID(string memory did) external;

    function isController(string memory did, address controller) external view returns (bool);
}

