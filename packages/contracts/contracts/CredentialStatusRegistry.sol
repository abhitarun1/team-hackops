// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CredentialStatusRegistry
 * @dev Manages credential status (revocation, suspension, update) on blockchain
 * @notice Implements W3C Verifiable Credential status list pattern
 */
contract CredentialStatusRegistry {
    // Credential status types
    enum Status {
        Active,      // Credential is valid
        Revoked,     // Credential has been revoked
        Suspended,   // Credential is temporarily suspended
        Expired      // Credential has expired
    }

    // Credential status entry
    struct CredentialStatus {
        string credentialId;      // Unique credential identifier
        address issuer;           // Issuer address
        Status status;            // Current status
        uint256 issuedAt;         // Issuance timestamp
        uint256 updatedAt;        // Last update timestamp
        uint256 expiresAt;         // Expiration timestamp (0 = no expiration)
        string reason;            // Reason for status change (optional)
        bool exists;              // Existence flag
    }

    // Mapping from credential ID to status
    mapping(string => CredentialStatus) public credentialStatuses;
    
    // Mapping from issuer to their credentials
    mapping(address => string[]) public issuerCredentials;
    
    // Mapping from credential ID to update history
    mapping(string => StatusUpdate[]) public statusHistory;

    // Status update history entry
    struct StatusUpdate {
        Status status;
        uint256 timestamp;
        address updatedBy;
        string reason;
    }

    // Events
    event CredentialIssued(
        string indexed credentialId,
        address indexed issuer,
        uint256 issuedAt,
        uint256 expiresAt
    );
    
    event CredentialStatusUpdated(
        string indexed credentialId,
        Status indexed oldStatus,
        Status indexed newStatus,
        address updatedBy,
        string reason
    );
    
    event CredentialRevoked(
        string indexed credentialId,
        address indexed issuer,
        string reason
    );
    
    event CredentialSuspended(
        string indexed credentialId,
        address indexed issuer,
        string reason
    );
    
    event CredentialReactivated(
        string indexed credentialId,
        address indexed issuer
    );

    /**
     * @dev Modifier to check if caller is the issuer
     */
    modifier onlyIssuer(string memory credentialId) {
        require(
            credentialStatuses[credentialId].issuer == msg.sender,
            "Only issuer can update credential status"
        );
        _;
    }

    /**
     * @dev Issue a new credential and register its status
     * @param credentialId Unique credential identifier
     * @param expiresAt Expiration timestamp (0 = no expiration)
     */
    function issueCredential(
        string memory credentialId,
        uint256 expiresAt
    ) public {
        require(
            !credentialStatuses[credentialId].exists,
            "Credential already exists"
        );
        require(bytes(credentialId).length > 0, "Credential ID cannot be empty");
        
        credentialStatuses[credentialId] = CredentialStatus({
            credentialId: credentialId,
            issuer: msg.sender,
            status: Status.Active,
            issuedAt: block.timestamp,
            updatedAt: block.timestamp,
            expiresAt: expiresAt,
            reason: "",
            exists: true
        });
        
        issuerCredentials[msg.sender].push(credentialId);
        
        statusHistory[credentialId].push(StatusUpdate({
            status: Status.Active,
            timestamp: block.timestamp,
            updatedBy: msg.sender,
            reason: "Credential issued"
        }));
        
        emit CredentialIssued(
            credentialId,
            msg.sender,
            block.timestamp,
            expiresAt
        );
    }

    /**
     * @dev Update credential status
     * @param credentialId The credential identifier
     * @param newStatus The new status
     * @param reason Reason for status change
     */
    function updateStatus(
        string memory credentialId,
        Status newStatus,
        string memory reason
    ) public onlyIssuer(credentialId) {
        require(
            credentialStatuses[credentialId].exists,
            "Credential does not exist"
        );
        
        Status oldStatus = credentialStatuses[credentialId].status;
        require(oldStatus != newStatus, "Status unchanged");
        
        // Check expiration
        if (credentialStatuses[credentialId].expiresAt > 0) {
            require(
                block.timestamp <= credentialStatuses[credentialId].expiresAt,
                "Credential has expired"
            );
        }
        
        credentialStatuses[credentialId].status = newStatus;
        credentialStatuses[credentialId].updatedAt = block.timestamp;
        credentialStatuses[credentialId].reason = reason;
        
        statusHistory[credentialId].push(StatusUpdate({
            status: newStatus,
            timestamp: block.timestamp,
            updatedBy: msg.sender,
            reason: reason
        }));
        
        emit CredentialStatusUpdated(
            credentialId,
            oldStatus,
            newStatus,
            msg.sender,
            reason
        );
        
        // Emit specific events
        if (newStatus == Status.Revoked) {
            emit CredentialRevoked(credentialId, msg.sender, reason);
        } else if (newStatus == Status.Suspended) {
            emit CredentialSuspended(credentialId, msg.sender, reason);
        } else if (newStatus == Status.Active && oldStatus == Status.Suspended) {
            emit CredentialReactivated(credentialId, msg.sender);
        }
    }

    /**
     * @dev Revoke a credential
     * @param credentialId The credential identifier
     * @param reason Reason for revocation
     */
    function revokeCredential(
        string memory credentialId,
        string memory reason
    ) public onlyIssuer(credentialId) {
        updateStatus(credentialId, Status.Revoked, reason);
    }

    /**
     * @dev Suspend a credential
     * @param credentialId The credential identifier
     * @param reason Reason for suspension
     */
    function suspendCredential(
        string memory credentialId,
        string memory reason
    ) public onlyIssuer(credentialId) {
        updateStatus(credentialId, Status.Suspended, reason);
    }

    /**
     * @dev Reactivate a suspended credential
     * @param credentialId The credential identifier
     */
    function reactivateCredential(string memory credentialId) 
        public 
        onlyIssuer(credentialId) 
    {
        require(
            credentialStatuses[credentialId].status == Status.Suspended,
            "Credential is not suspended"
        );
        updateStatus(credentialId, Status.Active, "Credential reactivated");
    }

    /**
     * @dev Check credential status (for verifiers)
     * @param credentialId The credential identifier
     * @return status Current status
     * @return isValid True if credential is valid (Active and not expired)
     * @return expiresAt Expiration timestamp
     */
    function checkStatus(string memory credentialId)
        public
        view
        returns (
            Status status,
            bool isValid,
            uint256 expiresAt
        )
    {
        require(
            credentialStatuses[credentialId].exists,
            "Credential does not exist"
        );
        
        CredentialStatus memory credStatus = credentialStatuses[credentialId];
        status = credStatus.status;
        expiresAt = credStatus.expiresAt;
        
        // Check if valid: Active status and not expired
        isValid = (status == Status.Active);
        if (isValid && expiresAt > 0) {
            isValid = block.timestamp <= expiresAt;
        }
    }

    /**
     * @dev Get credential status details
     * @param credentialId The credential identifier
     * @return credStatus The credential status struct
     */
    function getCredentialStatus(string memory credentialId)
        public
        view
        returns (CredentialStatus memory credStatus)
    {
        require(
            credentialStatuses[credentialId].exists,
            "Credential does not exist"
        );
        return credentialStatuses[credentialId];
    }

    /**
     * @dev Get status update history for a credential
     * @param credentialId The credential identifier
     * @return updates Array of status updates
     */
    function getStatusHistory(string memory credentialId)
        public
        view
        returns (StatusUpdate[] memory updates)
    {
        return statusHistory[credentialId];
    }

    /**
     * @dev Get all credentials issued by an address
     * @param issuer The issuer address
     * @return credentialIds Array of credential IDs
     */
    function getCredentialsByIssuer(address issuer)
        public
        view
        returns (string[] memory credentialIds)
    {
        return issuerCredentials[issuer];
    }

    /**
     * @dev Batch check multiple credential statuses
     * @param credentialIds Array of credential identifiers
     * @return statuses Array of status results
     * @return validities Array of validity flags
     */
    function batchCheckStatus(string[] memory credentialIds)
        public
        view
        returns (Status[] memory statuses, bool[] memory validities)
    {
        statuses = new Status[](credentialIds.length);
        validities = new bool[](credentialIds.length);
        
        for (uint256 i = 0; i < credentialIds.length; i++) {
            if (credentialStatuses[credentialIds[i]].exists) {
                CredentialStatus memory credStatus = credentialStatuses[credentialIds[i]];
                statuses[i] = credStatus.status;
                validities[i] = (credStatus.status == Status.Active);
                if (validities[i] && credStatus.expiresAt > 0) {
                    validities[i] = block.timestamp <= credStatus.expiresAt;
                }
            } else {
                statuses[i] = Status.Revoked; // Treat non-existent as revoked
                validities[i] = false;
            }
        }
    }
}

