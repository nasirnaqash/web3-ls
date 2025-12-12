// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title LinkIO
 * @dev A decentralized link shortener and media sharing platform
 * @notice This contract stores shortened links and IPFS hashes for media files
 */
contract LinkIO is Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _linkCounter;
    Counters.Counter private _mediaCounter;

    enum ContentType { LINK, MEDIA }

    struct LinkData {
        string originalUrl;
        address creator;
        uint256 createdAt;
        uint256 clicks;
        bool exists;
    }

    struct MediaData {
        string ipfsHash;
        string fileName;
        string fileType;
        uint256 fileSize;
        address creator;
        uint256 createdAt;
        uint256 views;
        bool exists;
    }

    // Mapping from short code to link data
    mapping(string => LinkData) public links;

    // Mapping from short code to media data
    mapping(string => MediaData) public media;

    // Mapping from address to their created short codes
    mapping(address => string[]) public userLinks;
    mapping(address => string[]) public userMedia;

    // Events
    event LinkCreated(string indexed shortCode, string originalUrl, address indexed creator);
    event MediaUploaded(string indexed shortCode, string ipfsHash, string fileName, address indexed creator);
    event LinkAccessed(string indexed shortCode, address accessor);
    event MediaAccessed(string indexed shortCode, address accessor);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Generate a unique short code based on counter and block data
     * @param contentType Type of content (LINK or MEDIA)
     * @return shortCode The generated unique short code
     */
    function _generateShortCode(ContentType contentType) internal returns (string memory) {
        uint256 counter;
        if (contentType == ContentType.LINK) {
            _linkCounter.increment();
            counter = _linkCounter.current();
        } else {
            _mediaCounter.increment();
            counter = _mediaCounter.current();
        }

        bytes memory chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        uint256 seed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            counter
        )));

        bytes memory shortCode = new bytes(6);
        for (uint256 i = 0; i < 6; i++) {
            shortCode[i] = chars[seed % 62];
            seed = seed / 62;
        }

        return string(shortCode);
    }

    /**
     * @dev Create a shortened link
     * @param originalUrl The original URL to shorten
     * @return shortCode The generated short code
     */
    function createShortLink(string calldata originalUrl) external returns (string memory shortCode) {
        require(bytes(originalUrl).length > 0, "URL cannot be empty");
        require(bytes(originalUrl).length <= 2048, "URL too long");

        shortCode = _generateShortCode(ContentType.LINK);

        // Ensure unique (extremely rare collision)
        while (links[shortCode].exists) {
            shortCode = _generateShortCode(ContentType.LINK);
        }

        links[shortCode] = LinkData({
            originalUrl: originalUrl,
            creator: msg.sender,
            createdAt: block.timestamp,
            clicks: 0,
            exists: true
        });

        userLinks[msg.sender].push(shortCode);

        emit LinkCreated(shortCode, originalUrl, msg.sender);

        return shortCode;
    }

    /**
     * @dev Upload media file metadata (IPFS hash)
     * @param ipfsHash The IPFS hash of the uploaded file
     * @param fileName Original file name
     * @param fileType MIME type of the file
     * @param fileSize Size of the file in bytes
     * @return shortCode The generated short code
     */
    function uploadMedia(
        string calldata ipfsHash,
        string calldata fileName,
        string calldata fileType,
        uint256 fileSize
    ) external returns (string memory shortCode) {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(fileName).length > 0, "File name cannot be empty");

        shortCode = _generateShortCode(ContentType.MEDIA);

        // Ensure unique
        while (media[shortCode].exists) {
            shortCode = _generateShortCode(ContentType.MEDIA);
        }

        media[shortCode] = MediaData({
            ipfsHash: ipfsHash,
            fileName: fileName,
            fileType: fileType,
            fileSize: fileSize,
            creator: msg.sender,
            createdAt: block.timestamp,
            views: 0,
            exists: true
        });

        userMedia[msg.sender].push(shortCode);

        emit MediaUploaded(shortCode, ipfsHash, fileName, msg.sender);

        return shortCode;
    }

    /**
     * @dev Get the original URL from a short code
     * @param shortCode The short code to look up
     * @return originalUrl The original URL
     */
    function getLink(string calldata shortCode) external returns (string memory originalUrl) {
        require(links[shortCode].exists, "Link does not exist");

        links[shortCode].clicks++;
        emit LinkAccessed(shortCode, msg.sender);

        return links[shortCode].originalUrl;
    }

    /**
     * @dev Get media data from a short code
     * @param shortCode The short code to look up
     * @return ipfsHash The IPFS hash
     * @return fileName The original file name
     * @return fileType The MIME type
     * @return fileSize The file size
     */
    function getMedia(string calldata shortCode) external returns (
        string memory ipfsHash,
        string memory fileName,
        string memory fileType,
        uint256 fileSize
    ) {
        require(media[shortCode].exists, "Media does not exist");

        media[shortCode].views++;
        emit MediaAccessed(shortCode, msg.sender);

        MediaData memory m = media[shortCode];
        return (m.ipfsHash, m.fileName, m.fileType, m.fileSize);
    }

    /**
     * @dev Get link data without incrementing click count (view only)
     * @param shortCode The short code to look up
     */
    function getLinkData(string calldata shortCode) external view returns (
        string memory originalUrl,
        address creator,
        uint256 createdAt,
        uint256 clicks
    ) {
        require(links[shortCode].exists, "Link does not exist");
        LinkData memory l = links[shortCode];
        return (l.originalUrl, l.creator, l.createdAt, l.clicks);
    }

    /**
     * @dev Get media data without incrementing view count (view only)
     * @param shortCode The short code to look up
     */
    function getMediaData(string calldata shortCode) external view returns (
        string memory ipfsHash,
        string memory fileName,
        string memory fileType,
        uint256 fileSize,
        address creator,
        uint256 createdAt,
        uint256 views
    ) {
        require(media[shortCode].exists, "Media does not exist");
        MediaData memory m = media[shortCode];
        return (m.ipfsHash, m.fileName, m.fileType, m.fileSize, m.creator, m.createdAt, m.views);
    }

    /**
     * @dev Get all links created by a user
     * @param user Address of the user
     */
    function getUserLinks(address user) external view returns (string[] memory) {
        return userLinks[user];
    }

    /**
     * @dev Get all media uploaded by a user
     * @param user Address of the user
     */
    function getUserMedia(address user) external view returns (string[] memory) {
        return userMedia[user];
    }

    /**
     * @dev Get total number of links created
     */
    function getTotalLinks() external view returns (uint256) {
        return _linkCounter.current();
    }

    /**
     * @dev Get total number of media files uploaded
     */
    function getTotalMedia() external view returns (uint256) {
        return _mediaCounter.current();
    }

    /**
     * @dev Check if a short code exists for links
     */
    function linkExists(string calldata shortCode) external view returns (bool) {
        return links[shortCode].exists;
    }

    /**
     * @dev Check if a short code exists for media
     */
    function mediaExists(string calldata shortCode) external view returns (bool) {
        return media[shortCode].exists;
    }
}
