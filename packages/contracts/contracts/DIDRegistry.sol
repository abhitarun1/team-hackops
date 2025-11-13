// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DIDRegistry
 * @dev W3C DID-compliant decentralized identifier registry on blockchain
 * @notice Stores DID documents and allows updates by DID controllers
 */
contract DIDRegistry {
    // DID Document structure following W3C DID spec
    struct DIDDocument {
        string id;                    // DID identifier (e.g., did:ethr:0x...)
        string[] context;             // JSON-LD contexts
        string[] controller;          // DID controllers
        string[] publicKey;           // Public keys in JWK format
        string[] service;             // Service endpoints
        uint256 created;              // Creation timestamp
        uint256 updated;              // Last update timestamp
        bool exists;                  // Existence flag
    }

    // Mapping from DID to DID Document
    mapping(string => DIDDocument) public didDocuments;
    
    // Mapping from DID to controller addresses
    mapping(string => address[]) public didControllers;
    
    // Mapping from controller address to DIDs they control
    mapping(address => string[]) public controllerDIDs;
    
    // Events following W3C DID spec
    event DIDCreated(
        string indexed did,
        address indexed controller,
        uint256 timestamp
    );
    
    event DIDUpdated(
        string indexed did,
        address indexed controller,
        uint256 timestamp
    );
    
    event DIDDeactivated(
        string indexed did,
        address indexed controller,
        uint256 timestamp
    );
    
    event ControllerAdded(
        string indexed did,
        address indexed controller
    );
    
    event ControllerRemoved(
        string indexed did,
        address indexed controller
    );

    /**
     * @dev Modifier to check if caller is a controller of the DID
     */
    modifier onlyController(string memory did) {
        require(isController(did, msg.sender), "Not a controller of this DID");
        _;
    }

    /**
     * @dev Check if an address is a controller of a DID
     */
    function isController(string memory did, address controller) 
        public 
        view 
        returns (bool) 
    {
        address[] memory controllers = didControllers[did];
        for (uint256 i = 0; i < controllers.length; i++) {
            if (controllers[i] == controller) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Create a new DID document
     * @param did The DID identifier (must be unique)
     * @param context JSON-LD contexts
     * @param publicKeys Public keys in JWK format
     * @param services Service endpoints
     */
    function createDID(
        string memory did,
        string[] memory context,
        string[] memory publicKeys,
        string[] memory services
    ) public {
        require(!didDocuments[did].exists, "DID already exists");
        require(bytes(did).length > 0, "DID cannot be empty");
        
        didDocuments[did] = DIDDocument({
            id: did,
            context: context,
            controller: new string[](0),
            publicKey: publicKeys,
            service: services,
            created: block.timestamp,
            updated: block.timestamp,
            exists: true
        });
        
        // Add creator as controller
        didControllers[did].push(msg.sender);
        controllerDIDs[msg.sender].push(did);
        
        emit DIDCreated(did, msg.sender, block.timestamp);
    }

    /**
     * @dev Update an existing DID document
     * @param did The DID identifier
     * @param context Updated JSON-LD contexts
     * @param publicKeys Updated public keys
     * @param services Updated service endpoints
     */
    function updateDID(
        string memory did,
        string[] memory context,
        string[] memory publicKeys,
        string[] memory services
    ) public onlyController(did) {
        require(didDocuments[did].exists, "DID does not exist");
        
        didDocuments[did].context = context;
        didDocuments[did].publicKey = publicKeys;
        didDocuments[did].service = services;
        didDocuments[did].updated = block.timestamp;
        
        emit DIDUpdated(did, msg.sender, block.timestamp);
    }

    /**
     * @dev Add a controller to a DID
     * @param did The DID identifier
     * @param controller The address to add as controller
     */
    function addController(string memory did, address controller) 
        public 
        onlyController(did) 
    {
        require(!isController(did, controller), "Already a controller");
        require(controller != address(0), "Invalid controller address");
        
        didControllers[did].push(controller);
        controllerDIDs[controller].push(did);
        
        emit ControllerAdded(did, controller);
    }

    /**
     * @dev Remove a controller from a DID
     * @param did The DID identifier
     * @param controller The address to remove as controller
     */
    function removeController(string memory did, address controller) 
        public 
        onlyController(did) 
    {
        require(isController(did, controller), "Not a controller");
        require(didControllers[did].length > 1, "Cannot remove last controller");
        
        address[] storage controllers = didControllers[did];
        for (uint256 i = 0; i < controllers.length; i++) {
            if (controllers[i] == controller) {
                controllers[i] = controllers[controllers.length - 1];
                controllers.pop();
                break;
            }
        }
        
        // Remove from controllerDIDs mapping
        string[] storage dids = controllerDIDs[controller];
        for (uint256 i = 0; i < dids.length; i++) {
            if (keccak256(bytes(dids[i])) == keccak256(bytes(did))) {
                dids[i] = dids[dids.length - 1];
                dids.pop();
                break;
            }
        }
        
        emit ControllerRemoved(did, controller);
    }

    /**
     * @dev Deactivate a DID (soft delete)
     * @param did The DID identifier
     */
    function deactivateDID(string memory did) public onlyController(did) {
        require(didDocuments[did].exists, "DID does not exist");
        
        didDocuments[did].exists = false;
        didDocuments[did].updated = block.timestamp;
        
        emit DIDDeactivated(did, msg.sender, block.timestamp);
    }

    /**
     * @dev Resolve a DID to its document (W3C DID resolution)
     * @param did The DID identifier
     * @return document The DID document
     */
    function resolveDID(string memory did) 
        public 
        view 
        returns (DIDDocument memory document) 
    {
        require(didDocuments[did].exists, "DID does not exist");
        return didDocuments[did];
    }

    /**
     * @dev Get all controllers of a DID
     * @param did The DID identifier
     * @return controllers Array of controller addresses
     */
    function getControllers(string memory did) 
        public 
        view 
        returns (address[] memory controllers) 
    {
        return didControllers[did];
    }

    /**
     * @dev Get all DIDs controlled by an address
     * @param controller The controller address
     * @return dids Array of DID identifiers
     */
    function getDIDsByController(address controller) 
        public 
        view 
        returns (string[] memory dids) 
    {
        return controllerDIDs[controller];
    }

    /**
     * @dev Check if a DID exists
     * @param did The DID identifier
     * @return exists True if DID exists
     */
    function didExists(string memory did) public view returns (bool exists) {
        return didDocuments[did].exists;
    }
}

