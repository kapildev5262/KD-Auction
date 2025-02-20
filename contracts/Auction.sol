// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error Auction__NotAdmin();
error Auction__NotActive();
error Auction__InvalidBid();
error Auction__AuctionEnded();
error Auction__NotVerified();
error Auction__InsufficientFee();
error Auction__ItemAlreadyVerified();
error Auction__InvalidItem();
error Auction__InvalidDuration();
error Auction__BidTooLow();
error Auction__SelfBidding();
error Auction__AlreadySold();
error Auction__NoFundsToWithdraw();
error Auction__TransferFailed();

contract Auction is ReentrancyGuard {
    address private immutable i_admin;
    bool private s_auctionActive;
    uint256 private s_auctionEndTime;
    
    uint256 public constant ITEM_SUBMISSION_FEE = 0.005 ether;
    uint256 public constant MINIMUM_BID_INCREMENT = 0.01 ether;
    uint256 public constant MAX_AUCTION_DURATION = 30 days;

    struct AuctionItem {
        uint256 itemId;
        string itemName;
        string itemDescription;
        uint256 startingPrice;
        address owner;
        address highestBidder;
        uint256 highestBid;
        bool verified;
        bool sold;
        uint96 bidCount;
    }

    mapping(uint256 => AuctionItem) public s_auctionItems;
    uint256[] private s_itemIds;
    mapping(address => uint256) private s_bidderBalances;
    mapping(uint256 => bool) private s_itemExists;

    event AuctionStarted(uint256 indexed endTime);
    event ItemSubmitted(uint256 indexed itemId, address indexed owner, string itemName, uint256 startingPrice);
    event ItemVerified(uint256 indexed itemId);
    event NewHighestBid(uint256 indexed itemId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed itemId, address indexed winner, uint256 winningBid);
    event BidderWithdrawal(address indexed bidder, uint256 amount);
    event EmergencyWithdrawal(uint256 amount);

    constructor() {
        i_admin = msg.sender;
        s_auctionActive = false;
    }

    modifier onlyAdmin() {
        if (msg.sender != i_admin) revert Auction__NotAdmin();
        _;
    }

    modifier auctionIsActive() {
        if (!s_auctionActive) revert Auction__NotActive();
        if (block.timestamp > s_auctionEndTime) revert Auction__AuctionEnded();
        _;
    }

    modifier itemExists(uint256 itemId) {
        if (!s_itemExists[itemId]) revert Auction__InvalidItem();
        _;
    }

    function startAuction(uint256 durationInMinutes) external onlyAdmin {
        if (durationInMinutes == 0 || durationInMinutes * 1 minutes > MAX_AUCTION_DURATION) 
            revert Auction__InvalidDuration();
        
        s_auctionActive = true;
        s_auctionEndTime = block.timestamp + (durationInMinutes * 1 minutes);
        emit AuctionStarted(s_auctionEndTime);
    }

    function submitItem(
        string calldata _itemName,
        string calldata _itemDescription,
        uint256 _startingPrice
    ) external payable {
        if (msg.value != ITEM_SUBMISSION_FEE) revert Auction__InsufficientFee();
        if (bytes(_itemName).length == 0 || bytes(_itemDescription).length == 0) 
            revert Auction__InvalidItem();

        uint256 itemId = uint256(
            keccak256(abi.encodePacked(_itemName, block.timestamp, msg.sender))
        );
        
        if (s_itemExists[itemId]) revert Auction__InvalidItem();

        s_auctionItems[itemId] = AuctionItem({
            itemId: itemId,
            itemName: _itemName,
            itemDescription: _itemDescription,
            startingPrice: _startingPrice,
            owner: msg.sender,
            highestBidder: address(0),
            highestBid: 0,
            verified: false,
            sold: false,
            bidCount: 0
        });

        s_itemIds.push(itemId);
        s_itemExists[itemId] = true;

        (bool success,) = payable(i_admin).call{value: msg.value}("");
        if (!success) revert Auction__TransferFailed();

        emit ItemSubmitted(itemId, msg.sender, _itemName, _startingPrice);
    }

    function verifyItem(uint256 itemId) 
        external 
        onlyAdmin 
        itemExists(itemId) 
    {
        if (s_auctionItems[itemId].verified) revert Auction__ItemAlreadyVerified();
        
        s_auctionItems[itemId].verified = true;
        emit ItemVerified(itemId);
    }

    function placeBid(uint256 itemId) 
        external 
        payable 
        auctionIsActive 
        nonReentrant 
        itemExists(itemId) 
    {
        AuctionItem storage item = s_auctionItems[itemId];
        
        if (!item.verified) revert Auction__NotVerified();
        if (msg.sender == item.owner) revert Auction__SelfBidding();
        if (item.sold) revert Auction__AlreadySold();
        
        uint256 minValidBid = item.highestBid > 0 
            ? item.highestBid + MINIMUM_BID_INCREMENT 
            : item.startingPrice;
            
        if (msg.value < minValidBid) revert Auction__BidTooLow();

        if (item.highestBidder != address(0)) {
            s_bidderBalances[item.highestBidder] += item.highestBid;
        }

        item.highestBidder = msg.sender;
        item.highestBid = msg.value;
        item.bidCount++;

        emit NewHighestBid(itemId, msg.sender, msg.value);
    }

    function withdraw() external nonReentrant {
        uint256 amount = s_bidderBalances[msg.sender];
        if (amount == 0) revert Auction__NoFundsToWithdraw();

        s_bidderBalances[msg.sender] = 0;
        
        (bool success,) = payable(msg.sender).call{value: amount}("");
        if (!success) revert Auction__TransferFailed();
        
        emit BidderWithdrawal(msg.sender, amount);
    }

    function endAuction(uint256 itemId) 
        external 
        onlyAdmin 
        itemExists(itemId) 
        nonReentrant 
    {
        if (!s_auctionActive) revert Auction__NotActive();
        if (block.timestamp <= s_auctionEndTime) revert Auction__AuctionEnded();

        AuctionItem storage item = s_auctionItems[itemId];
        if (item.sold) revert Auction__AlreadySold();

        item.sold = true;

        if (item.highestBidder != address(0)) {
            (bool success,) = payable(item.owner).call{value: item.highestBid}("");
            if (!success) revert Auction__TransferFailed();
        }

        emit AuctionEnded(itemId, item.highestBidder, item.highestBid);
    }

    function emergencyWithdraw() external onlyAdmin nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert Auction__NoFundsToWithdraw();
        
        (bool success,) = payable(i_admin).call{value: balance}("");
        if (!success) revert Auction__TransferFailed();
        
        emit EmergencyWithdrawal(balance);
    }

    // View Functions
    function getAdmin() external view returns (address) {
        return i_admin;
    }

    function getAllItemIds() external view returns (uint256[] memory) {
        return s_itemIds;
    }

    function getBidderBalance(address bidder) external view returns (uint256) {
        return s_bidderBalances[bidder];
    }

    function getAuctionStatus() external view returns (
        bool isActive,
        uint256 endTime,
        uint256 currentTime
    ) {
        return (
            s_auctionActive,
            s_auctionEndTime,
            block.timestamp
        );
    }

    function getMinimumValidBid(uint256 itemId) 
        external 
        view 
        itemExists(itemId) 
        returns (uint256) 
    {
        AuctionItem storage item = s_auctionItems[itemId];
        return item.highestBid > 0 
            ? item.highestBid + MINIMUM_BID_INCREMENT 
            : item.startingPrice;
    }

    receive() external payable {
        revert("Direct deposits not accepted");
    }

    fallback() external payable {
        revert("Invalid function call");
    }
}