// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICredentialStatusRegistry
 * @dev Interface for Credential Status Registry contract
 */
interface ICredentialStatusRegistry {
    enum Status {
        Active,
        Revoked,
        Suspended,
        Expired
    }

    struct CredentialStatus {
        string credentialId;
        address issuer;
        Status status;
        uint256 issuedAt;
        uint256 updatedAt;
        uint256 expiresAt;
        string reason;
        bool exists;
    }

    function issueCredential(
        string memory credentialId,
        uint256 expiresAt
    ) external;

    function checkStatus(string memory credentialId)
        external
        view
        returns (
            Status status,
            bool isValid,
            uint256 expiresAt
        );

    function revokeCredential(
        string memory credentialId,
        string memory reason
    ) external;

    function suspendCredential(
        string memory credentialId,
        string memory reason
    ) external;

    function reactivateCredential(string memory credentialId) external;
}

