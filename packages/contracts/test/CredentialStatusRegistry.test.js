const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CredentialStatusRegistry", function () {
  let credentialRegistry;
  let owner, issuer, verifier;

  beforeEach(async function () {
    [owner, issuer, verifier] = await ethers.getSigners();

    const CredentialStatusRegistry = await ethers.getContractFactory("CredentialStatusRegistry");
    credentialRegistry = await CredentialStatusRegistry.deploy();
    await credentialRegistry.waitForDeployment();
  });

  describe("Credential Issuance", function () {
    it("Should issue a new credential", async function () {
      const credentialId = "cred:123:abc";
      const expiresAt = 0; // No expiration

      await expect(credentialRegistry.connect(issuer).issueCredential(credentialId, expiresAt))
        .to.emit(credentialRegistry, "CredentialIssued")
        .withArgs(credentialId, issuer.address, await ethers.provider.getBlockNumber(), expiresAt);

      const status = await credentialRegistry.getCredentialStatus(credentialId);
      expect(status.exists).to.be.true;
      expect(status.issuer).to.equal(issuer.address);
    });

    it("Should not allow duplicate credential IDs", async function () {
      const credentialId = "cred:123:abc";
      const expiresAt = 0;

      await credentialRegistry.connect(issuer).issueCredential(credentialId, expiresAt);
      
      await expect(
        credentialRegistry.connect(issuer).issueCredential(credentialId, expiresAt)
      ).to.be.revertedWith("Credential already exists");
    });
  });

  describe("Credential Status Updates", function () {
    beforeEach(async function () {
      const credentialId = "cred:123:abc";
      const expiresAt = 0;
      await credentialRegistry.connect(issuer).issueCredential(credentialId, expiresAt);
    });

    it("Should revoke a credential", async function () {
      const credentialId = "cred:123:abc";
      const reason = "Credential compromised";

      await expect(credentialRegistry.connect(issuer).revokeCredential(credentialId, reason))
        .to.emit(credentialRegistry, "CredentialRevoked")
        .withArgs(credentialId, issuer.address, reason);

      const [status, isValid] = await credentialRegistry.checkStatus(credentialId);
      expect(status).to.equal(2); // Status.Revoked
      expect(isValid).to.be.false;
    });

    it("Should suspend a credential", async function () {
      const credentialId = "cred:123:abc";
      const reason = "Under investigation";

      await expect(credentialRegistry.connect(issuer).suspendCredential(credentialId, reason))
        .to.emit(credentialRegistry, "CredentialSuspended")
        .withArgs(credentialId, issuer.address, reason);

      const [status] = await credentialRegistry.checkStatus(credentialId);
      expect(status).to.equal(2); // Status.Suspended
    });

    it("Should reactivate a suspended credential", async function () {
      const credentialId = "cred:123:abc";
      await credentialRegistry.connect(issuer).suspendCredential(credentialId, "Test");

      await expect(credentialRegistry.connect(issuer).reactivateCredential(credentialId))
        .to.emit(credentialRegistry, "CredentialReactivated")
        .withArgs(credentialId, issuer.address);

      const [status, isValid] = await credentialRegistry.checkStatus(credentialId);
      expect(status).to.equal(0); // Status.Active
      expect(isValid).to.be.true;
    });

    it("Should not allow non-issuer to update status", async function () {
      const credentialId = "cred:123:abc";

      await expect(
        credentialRegistry.connect(verifier).revokeCredential(credentialId, "Test")
      ).to.be.revertedWith("Only issuer can update credential status");
    });
  });

  describe("Status Checking", function () {
    it("Should check credential status correctly", async function () {
      const credentialId = "cred:123:abc";
      const expiresAt = 0;
      
      await credentialRegistry.connect(issuer).issueCredential(credentialId, expiresAt);
      
      const [status, isValid] = await credentialRegistry.checkStatus(credentialId);
      expect(status).to.equal(0); // Status.Active
      expect(isValid).to.be.true;
    });

    it("Should handle expired credentials", async function () {
      const credentialId = "cred:123:abc";
      const expiresAt = Math.floor(Date.now() / 1000) - 1000; // Expired
      
      await credentialRegistry.connect(issuer).issueCredential(credentialId, expiresAt);
      
      const [status, isValid] = await credentialRegistry.checkStatus(credentialId);
      expect(isValid).to.be.false;
    });
  });
});

