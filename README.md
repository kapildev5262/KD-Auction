# KD-Auction

KD-Auction is a decentralized auction platform built on the Ethereum blockchain. It enables users to create auctions, place bids, and finalize outcomes securely and transparently using smart contracts, ensuring fairness and eliminating intermediaries.

_This repo has been updated to work with Sepolia Testnet._

## Features

- **Auction Management**
  - Admin-controlled auction start/end
  - Configurable auction duration (up to 30 days)
  - Emergency withdrawal functionality
  - Automatic bidder refunds

- **Item Management**
  - Item submission with verification
  - Detailed item descriptions
  - Item ownership tracking
  - Submission fee system

- **Bidding System**
  - Minimum bid increments
  - Automatic outbid refunds
  - Self-bidding prevention
  - Concurrent bid handling

- **Security Features**
  - Reentrancy protection
  - Admin-only functions
  - Verified item status
  - Emergency controls

## Requirements

- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
  - You'll know you did it right if you can run `git --version`
- [Nodejs](https://nodejs.org/en/)
  - You'll know you've installed nodejs right if you can run `node --version`
- [Yarn](https://yarnpkg.com/getting-started/install) instead of `npm`
  - You'll know you've installed yarn right if you can run `yarn --version`
  - You might need to [install it with `npm`](https://classic.yarnpkg.com/lang/en/docs/install/) or `corepack`

## Quickstart

```bash
git clone https://github.com/kapildev5262/Krishna-Funds.git
cd Krishna-Funds
yarn
```

## Contract Details

### Constants

```solidity
ITEM_SUBMISSION_FEE = 0.005 ether
MINIMUM_BID_INCREMENT = 0.01 ether
MAX_AUCTION_DURATION = 30 days
```

### Main Functions

#### Admin Functions
- `startAuction(uint256 durationInMinutes)`: Start a new auction
- `verifyItem(uint256 itemId)`: Verify an item for auction
- `endAuction(uint256 itemId)`: End an auction for a specific item
- `emergencyWithdraw()`: Emergency fund withdrawal

#### User Functions
- `submitItem(string itemName, string itemDescription, uint256 startingPrice)`: Submit an item
- `placeBid(uint256 itemId)`: Place a bid on an item
- `withdraw()`: Withdraw outbid funds

#### View Functions
- `getAdmin()`: Get admin address
- `getAllItemIds()`: Get all item IDs
- `getBidderBalance(address bidder)`: Get bidder's withdrawable balance
- `getAuctionStatus()`: Get current auction status
- `getMinimumValidBid(uint256 itemId)`: Get minimum valid bid for an item

## Development

### Testing

```bash
yarn hardhat test
```

### Test Coverage

```bash
yarn hardhat coverage
```

### Local Development

1. Setup local blockchain:
```bash
yarn hardhat node
```

2. Configure MetaMask:
- New RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Import accounts using private keys from hardhat node

3. Deploy contracts:
```bash
yarn hardhat deploy
```

## Deployment to Testnet/Mainnet

1. Setup environment variables in `.env`:
```
SEPOLIA_RPC_URL=your-rpc-url
PRIVATE_KEY=your-private-key
ETHERSCAN_API_KEY=your-etherscan-key
COINMARKETCAP_API_KEY=your-coinmarketcap-key
```

2. Get testnet ETH from [faucets.chain.link](https://faucets.chain.link/)

3. Deploy to Sepolia:
```bash
yarn hardhat deploy --network sepolia
```

### Verify Contract on Etherscan

Automatic verification:
```bash
yarn hardhat verify --network sepolia
```

Manual verification:
```bash
yarn hardhat verify --constructor-args arguments.js DEPLOYED_CONTRACT_ADDRESS
```

## Gas Estimation

Generate gas report:
```bash
yarn hardhat test
```
Results will be in `gas-report.txt`

For USD estimation, uncomment `coinmarketcap` line in `hardhat.config.js`

## Code Quality

### Linting

Install solhint:
```bash
yarn add -D solhint
```

Run linter:
```bash
yarn lint
```

Fix linting issues:
```bash
yarn lint:fix
```

### Formatting

```bash
yarn format
```

## Error Handling

The contract uses custom errors for gas efficiency:
- `Auction__NotAdmin()`
- `Auction__NotActive()`
- `Auction__InvalidBid()`
- `Auction__AuctionEnded()`
- And more...

## Events

The contract emits events for important actions:
- `AuctionStarted`
- `ItemSubmitted`
- `ItemVerified`
- `NewHighestBid`
- `AuctionEnded`
- `BidderWithdrawal`
- `EmergencyWithdrawal`

## Usage Example

```javascript
// Deploy contract
const Auction = await ethers.getContractFactory("Auction");
const auction = await Auction.deploy();
await auction.deployed();

// Start auction (admin only)
await auction.startAuction(60); // 60 minutes duration

// Submit item
await auction.submitItem(
    "Vintage Watch",
    "1960s Chronograph in excellent condition",
    ethers.utils.parseEther("0.1"), // Starting price
    { value: ethers.utils.parseEther("0.005") } // Submission fee
);

// Place bid
await auction.placeBid(itemId, {
    value: ethers.utils.parseEther("0.2")
});
```

## Security Considerations

1. ReentrancyGuard protection
2. Admin-only function restrictions
3. Bid verification system
4. Self-bidding prevention
5. Emergency controls
6. Item verification system

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## Support

For support, please open an issue in the repository or contact the development team.

## Disclaimer

This smart contract is provided as-is. Users should conduct their own security audit before using in production.

## Thank you!
