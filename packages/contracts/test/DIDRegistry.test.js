const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DIDRegistry", function () {
  let didRegistry;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
    didRegistry = await DIDRegistry.deploy();
    await didRegistry.waitForDeployment();
  });

  describe("DID Creation", function () {
    it("Should create a new DID", async function () {
      const did = "did:ethr:0x123";
      const context = ["https://www.w3.org/ns/did/v1"];
      const publicKeys = ['{"id":"key1","type":"EcdsaSecp256k1VerificationKey2019"}'];
      const services = [];

      await expect(didRegistry.createDID(did, context, publicKeys, services))
        .to.emit(didRegistry, "DIDCreated")
        .withArgs(did, owner.address, await ethers.provider.getBlockNumber());

      const document = await didRegistry.resolveDID(did);
      expect(document.id).to.equal(did);
      expect(document.exists).to.be.true;
    });

    it("Should not allow duplicate DIDs", async function () {
      const did = "did:ethr:0x123";
      const context = ["https://www.w3.org/ns/did/v1"];
      const publicKeys = [];
      const services = [];

      await didRegistry.createDID(did, context, publicKeys, services);
      
      await expect(
        didRegistry.createDID(did, context, publicKeys, services)
      ).to.be.revertedWith("DID already exists");
    });
  });

  describe("DID Updates", function () {
    beforeEach(async function () {
      const did = "did:ethr:0x123";
      const context = ["https://www.w3.org/ns/did/v1"];
      const publicKeys = [];
      const services = [];
      await didRegistry.createDID(did, context, publicKeys, services);
    });

    it("Should update DID document", async function () {
      const did = "did:ethr:0x123";
      const newContext = ["https://www.w3.org/ns/did/v1", "https://example.com/context"];
      const newPublicKeys = ['{"id":"key1","type":"EcdsaSecp256k1VerificationKey2019"}'];
      const newServices = ['{"id":"service1","type":"IdentityHub","serviceEndpoint":"https://hub.example.com"}'];

      await expect(didRegistry.updateDID(did, newContext, newPublicKeys, newServices))
        .to.emit(didRegistry, "DIDUpdated");

      const document = await didRegistry.resolveDID(did);
      expect(document.context.length).to.equal(2);
      expect(document.publicKey.length).to.equal(1);
      expect(document.service.length).to.equal(1);
    });

    it("Should not allow non-controller to update", async function () {
      const did = "did:ethr:0x123";
      const newContext = [];
      const newPublicKeys = [];
      const newServices = [];

      await expect(
        didRegistry.connect(addr1).updateDID(did, newContext, newPublicKeys, newServices)
      ).to.be.revertedWith("Not a controller of this DID");
    });
  });

  describe("Controller Management", function () {
    beforeEach(async function () {
      const did = "did:ethr:0x123";
      const context = ["https://www.w3.org/ns/did/v1"];
      const publicKeys = [];
      const services = [];
      await didRegistry.createDID(did, context, publicKeys, services);
    });

    it("Should add a controller", async function () {
      const did = "did:ethr:0x123";
      
      await expect(didRegistry.addController(did, addr1.address))
        .to.emit(didRegistry, "ControllerAdded")
        .withArgs(did, addr1.address);

      const isController = await didRegistry.isController(did, addr1.address);
      expect(isController).to.be.true;
    });

    it("Should remove a controller", async function () {
      const did = "did:ethr:0x123";
      await didRegistry.addController(did, addr1.address);
      
      await expect(didRegistry.removeController(did, addr1.address))
        .to.emit(didRegistry, "ControllerRemoved")
        .withArgs(did, addr1.address);

      const isController = await didRegistry.isController(did, addr1.address);
      expect(isController).to.be.false;
    });

    it("Should not allow removing last controller", async function () {
      const did = "did:ethr:0x123";
      
      await expect(
        didRegistry.removeController(did, owner.address)
      ).to.be.revertedWith("Cannot remove last controller");
    });
  });

  describe("DID Deactivation", function () {
    beforeEach(async function () {
      const did = "did:ethr:0x123";
      const context = ["https://www.w3.org/ns/did/v1"];
      const publicKeys = [];
      const services = [];
      await didRegistry.createDID(did, context, publicKeys, services);
    });

    it("Should deactivate a DID", async function () {
      const did = "did:ethr:0x123";
      
      await expect(didRegistry.deactivateDID(did))
        .to.emit(didRegistry, "DIDDeactivated");

      const document = await didRegistry.resolveDID(did);
      expect(document.exists).to.be.false;
    });
  });
});

