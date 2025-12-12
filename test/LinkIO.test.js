const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LinkIO", function () {
  let linkIO;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const LinkIO = await ethers.getContractFactory("LinkIO");
    linkIO = await LinkIO.deploy();
    await linkIO.waitForDeployment();
  });

  describe("Link Shortening", function () {
    it("Should create a short link", async function () {
      const originalUrl = "https://example.com/very/long/url/path";
      const tx = await linkIO.connect(user1).createShortLink(originalUrl);
      const receipt = await tx.wait();

      // Get the short code from the event
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "LinkCreated"
      );
      expect(event).to.not.be.undefined;

      const shortCode = event.args.shortCode;
      expect(shortCode.length).to.equal(6);

      // Verify the link exists
      expect(await linkIO.linkExists(shortCode)).to.be.true;
    });

    it("Should retrieve the original URL", async function () {
      const originalUrl = "https://example.com/test";
      const tx = await linkIO.connect(user1).createShortLink(originalUrl);
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "LinkCreated"
      );
      const shortCode = event.args.shortCode;

      const [url, creator, , clicks] = await linkIO.getLinkData(shortCode);
      expect(url).to.equal(originalUrl);
      expect(creator).to.equal(user1.address);
      expect(clicks).to.equal(0);
    });

    it("Should increment click count when accessing link", async function () {
      const originalUrl = "https://example.com/test";
      const tx = await linkIO.connect(user1).createShortLink(originalUrl);
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "LinkCreated"
      );
      const shortCode = event.args.shortCode;

      // Access the link
      await linkIO.connect(user2).getLink(shortCode);

      const [, , , clicks] = await linkIO.getLinkData(shortCode);
      expect(clicks).to.equal(1);
    });

    it("Should reject empty URLs", async function () {
      await expect(
        linkIO.connect(user1).createShortLink("")
      ).to.be.revertedWith("URL cannot be empty");
    });

    it("Should track user links", async function () {
      await linkIO.connect(user1).createShortLink("https://example1.com");
      await linkIO.connect(user1).createShortLink("https://example2.com");

      const userLinks = await linkIO.getUserLinks(user1.address);
      expect(userLinks.length).to.equal(2);
    });
  });

  describe("Media Sharing", function () {
    const testIpfsHash = "QmTest1234567890abcdefghijklmnopqrstuvwxyz";
    const testFileName = "test-image.png";
    const testFileType = "image/png";
    const testFileSize = 1024000;

    it("Should upload media metadata", async function () {
      const tx = await linkIO.connect(user1).uploadMedia(
        testIpfsHash,
        testFileName,
        testFileType,
        testFileSize
      );
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "MediaUploaded"
      );
      expect(event).to.not.be.undefined;

      const shortCode = event.args.shortCode;
      expect(shortCode.length).to.equal(6);
      expect(await linkIO.mediaExists(shortCode)).to.be.true;
    });

    it("Should retrieve media data", async function () {
      const tx = await linkIO.connect(user1).uploadMedia(
        testIpfsHash,
        testFileName,
        testFileType,
        testFileSize
      );
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "MediaUploaded"
      );
      const shortCode = event.args.shortCode;

      const [ipfsHash, fileName, fileType, fileSize, creator, , views] =
        await linkIO.getMediaData(shortCode);

      expect(ipfsHash).to.equal(testIpfsHash);
      expect(fileName).to.equal(testFileName);
      expect(fileType).to.equal(testFileType);
      expect(fileSize).to.equal(testFileSize);
      expect(creator).to.equal(user1.address);
      expect(views).to.equal(0);
    });

    it("Should increment view count when accessing media", async function () {
      const tx = await linkIO.connect(user1).uploadMedia(
        testIpfsHash,
        testFileName,
        testFileType,
        testFileSize
      );
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "MediaUploaded"
      );
      const shortCode = event.args.shortCode;

      // Access the media
      await linkIO.connect(user2).getMedia(shortCode);

      const [, , , , , , views] = await linkIO.getMediaData(shortCode);
      expect(views).to.equal(1);
    });

    it("Should reject empty IPFS hash", async function () {
      await expect(
        linkIO.connect(user1).uploadMedia("", testFileName, testFileType, testFileSize)
      ).to.be.revertedWith("IPFS hash cannot be empty");
    });

    it("Should track user media", async function () {
      await linkIO.connect(user1).uploadMedia(
        testIpfsHash,
        "file1.png",
        testFileType,
        testFileSize
      );
      await linkIO.connect(user1).uploadMedia(
        testIpfsHash,
        "file2.png",
        testFileType,
        testFileSize
      );

      const userMedia = await linkIO.getUserMedia(user1.address);
      expect(userMedia.length).to.equal(2);
    });
  });

  describe("Statistics", function () {
    it("Should track total links", async function () {
      expect(await linkIO.getTotalLinks()).to.equal(0);

      await linkIO.connect(user1).createShortLink("https://example.com");
      expect(await linkIO.getTotalLinks()).to.equal(1);

      await linkIO.connect(user2).createShortLink("https://example2.com");
      expect(await linkIO.getTotalLinks()).to.equal(2);
    });

    it("Should track total media", async function () {
      expect(await linkIO.getTotalMedia()).to.equal(0);

      await linkIO.connect(user1).uploadMedia(
        "QmHash1",
        "file.png",
        "image/png",
        1000
      );
      expect(await linkIO.getTotalMedia()).to.equal(1);
    });
  });
});
