# AXELAR Interchain Tokens Solution (ITS)

<ul>
<li><a href="#Overview">Overview</a></li>
<li><a href="#No-Code-ITS-Portal">Create a new Interchain token</a></li>
<li><a href="#Create-New-Token">Programmatically Create New Interchain Token</a></li>
<li><a href="#Register-Existing-Token">Make an existing ERC-20 token an Interchain Token</a></li>
<li><a href="https://interchain.axelar.dev/">Check out the Interchain Portal</a></li>
</ul>

## Overview

### The Problem

Moving tokens between different blockchains is currently a complex and often inefficient process. It typically requires the use of specialized bridges, which can introduce inefficiencies and security vulnerabilities.

---

### The Solution: Interchain Tokens (ITS)

ITS provides a streamlined way to create "canonical" versions of your ERC-20 token that exist seamlessly across multiple blockchains. With ITS, you gain a unified representation of your token, no matter which chain you're interacting with.

---

### Key Features

- **Cross-chain Compatibility**: Effortlessly move tokens between supported blockchains.
- **Single Address**: Manage all versions of your token using a single Ethereum address.
- **Flexibility**: Create new tokens or upgrade existing ones with ease.
- **Open-source and Secure**: Built on open-source smart contracts and protected by a dynamic validator set.
- **User-friendly**: Includes the Interchain Portal, offering a simple interface for creating and managing tokens.

---

### Benefits

- **Improved Interoperability**: Seamlessly move value and assets across different blockchain ecosystems.
- **Increased Efficiency**: Simplify token management and reduce the complexity of cross-chain transactions.
- **Enhanced Security**: Leverage the decentralization and security of underlying blockchain networks.
- **Developer-friendly**: Easy-to-use tools and APIs for quick integration of Interchain Tokens into your applications.

---
### Key ITS Contract Addresses

- **Interchain Token Service**: [0xB5FB4BE02232B1bBA4dC8f81dc24C26980dE9e3C](https://etherscan.io/address/0xB5FB4BE02232B1bBA4dC8f81dc24C26980dE9e3C)
- **Interchain Token Factory**: [0x83a93500d23Fbc3e82B410aD07A6a9F7A0670D66](https://etherscan.io/address/0x83a93500d23Fbc3e82B410aD07A6a9F7A0670D66)

---
### In Summary

Interchain Tokens (ITS) represent a significant advancement towards a more interconnected and interoperable blockchain ecosystem. By simplifying cross-chain interactions, ITS empowers developers to build more sophisticated and innovative applications while ensuring security, efficiency, and ease of use.

For more information and documentation, visit the [Interchain Portal](https://docs.axelar.dev/dev/send-tokens/interchain-tokens/intro/) or contribute to our open-source repository!

---


# No-Code ITS Portal

The quickest way to explore and deploy interchain tokens is with Axelar’s **no-code frontend portal**.  
[**Click here for the testnet**](https://testnet.interchain.axelar.dev/)

---

### Portal Overview

The ITS portal provides two main paths for working with interchain tokens:

1. **Deploy a New Token**: Create a fresh token available on multiple blockchains at once.  
2. **Connect an Existing Token**: Link an already deployed token to the Interchain Token Standard (ITS) and enable it for cross-chain functionality.

Once integrated, you can deploy additional interchain tokens to other blockchains, making them bridgeable with your existing token.

---

### Deploy New Token

To deploy a new token:

1. **Connect your wallet**.  
2. **Select a source network** where you have sufficient funds.  
3. Click **Deploy a new Interchain Token**.  
4. Provide the following details for your new token:
   - **Token Name**: Name of the new token.
   - **Symbol**: Symbol of the token (e.g., `MYT`).
   - **Decimals**: Number of decimal places the token supports.
   - **Amount to Mint**: Initial supply of the token to be minted.
   - Optionally, you can mark the token as **mintable**, allowing the minter to mint new tokens in the future.  
5. **Select additional chains** where the token will be available. Optionally, specify the amount of the token to mint on each selected chain.  
6. If your wallet has sufficient funds, the token will be deployed and made available on all selected chains.

The deployed token will comply with the **Interchain Token Standard (ITS)**, enabling users to call the `interchainTransfer()` method to move tokens between blockchains seamlessly.

---

### Connect Existing Token

To connect an existing token:

1. **Connect your wallet**.  
2. **Select a source network** where your token resides and ensure you have sufficient funds.  
3. Paste the **address of the token** you want to connect to ITS.  
4. Click the **Register interchain token** button.  
5. **Select additional chains** where the token will be available.

Once registered, the system will:

- Set up a **lock/unlock Token Manager** for your custom token on the home chain.  
- Deploy a **native interchain token** on the remote chains you selected.  

These actions ensure your token is now fully integrated with ITS and ready for seamless cross-chain operations.

---

With the **ITS Portal**, you can easily create and manage tokens without writing code, streamlining the process of building interoperable blockchain solutions.

---
# Create New Token

Interchain Tokens are ERC-20 tokens deployed via the **Interchain Token Service (ITS)**. These tokens come with built-in integration to ITS, making them bridgeable to other blockchains as soon as they are deployed. If you are starting fresh and want a token with bridging capabilities from day one, ITS allows you to deploy a token directly through its own contract.

---

## Install the Axelar ITS Dependency

To use ITS in your project, install the Axelar Interchain Token Service package using `npm` or any other node package manager:

```bash
npm i @axelar-network/interchain-token-service
```
## Deploy an Interchain Token

To deploy a new interchain token on the current chain, use the `deployInterchainToken` function:

```solidity
bytes32 tokenId = its.deployInterchainToken(
    0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefab, // unique salt for token deployment
    'My Interchain Token', // token name
    'ITS', // token symbol
    18, // token decimals
    1000000, // initial token supply
    msg.sender // address receiving initially minted tokens
);
```
### Key Details:
- **Salt:** A unique value to ensure the token deployment is unique.
- **Token Name:** The name of your token (e.g., "My Interchain Token").
- **Token Symbol:** The ticker symbol for your token (e.g., "ITS").
- **Decimals:** The number of decimals your token will use.
- **Initial Supply:** The initial amount of tokens to be minted.
- **Recipient Address:** The address that will receive the initially minted tokens.
This function deploys an interchain token, connects it to ITS upon deployment, and returns a **unique token ID**.

---
## Deploy a Remote Interchain Token

To deploy the token on a remote chain as a cross-chain transaction, use the `deployRemoteInterchainToken` function:

```solidity
bytes32 tokenId = its.deployRemoteInterchainToken{value: msg.value}(
    'Ethereum', // original chain name
    0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefab, // salt
    msg.sender, // address to distribute token on destination chain
    'Avalanche', // destination chain name
    msg.value // gas sent for token deployment
);
```
### Key Details:
- **Original Chain Name:** The name of the chain where the token was originally deployed (e.g., "Ethereum").
- **Salt:** The same unique value used during the initial deployment.
- **Recipient Address:** The address on the destination chain that will receive the tokens.
- **Destination Chain Name:** The chain where the token will be deployed (e.g., "Avalanche").
- **Gas Value:** The gas amount required for token deployment on the destination chain.
This function deploys a remote interchain token on the specified destination chain and returns a **token ID**.

---
geable to the destination chain, and returns a token ID.   <-----------------
ChatGPT said:
ChatGPT
Here’s the content formatted in proper README.md code format:

markdown
Copy code
# Register Existing Token

If you own an ERC-20 token on a single chain and want a wrapped, bridgeable version on other chains, you can register it as a **Canonical Interchain Token** using the **Interchain Token Factory** contract. Each token can only be registered once as a canonical token on its “home chain.”

You can register your existing token directly via the contract or use the ITS Portal no-code solution.  
Take a look at the diagram below to understand the process of registering an existing token as a **Canonical Interchain Token**.

💡 **This diagram is interactive! Click on the function names.**

---

## Install the Axelar ITS Dependency

Install the Axelar Interchain Token Service (ITS) package using npm or any other Node.js package manager:

```bash
npm i @axelar-network/interchain-token-service
```
## Register Your Token as a Canonical Token

To register your existing token as a **Canonical Interchain Token**, use the [`registerCanonicalInterchainToken`](https://github.com/axelarnetwork/interchain-token-service/blob/main/contracts/InterchainTokenFactory.sol#L240) function:

```solidity
bytes32 tokenId = its.registerCanonicalInterchainToken(
    myTokenAddress // address of your canonical token
);
```
### Key Details:
- **Canonical Token Address**: The address of your existing token on its home chain.

### The [`registerCanonicalInterchainToken`](https://github.com/axelarnetwork/interchain-token-service/blob/main/contracts/InterchainTokenFactory.sol#L240) function:
- Deploys a **Lock/Unlock Token Manager** on the source chain.
- Connects the token to ITS upon deployment.
- Returns a **unique token ID**.

Once your token is registered on the home chain, you can deploy its remote counterparts on other chains using the `deployRemoteCanonicalInterchainToken` function.

## Deploy a Remote Canonical Interchain Token
To deploy the token on a remote chain as a cross-chain transaction, use the [`deployRemoteCanonicalInterchainToken`](https://github.com/axelarnetwork/interchain-token-service/blob/main/contracts/InterchainTokenFactory.sol#L257) function:

```solidity
bytes32 tokenId = its.deployRemoteCanonicalInterchainToken{value: msg.value}(
    'Ethereum',       // original chain name
    myTokenAddress,   // original token address
    'Avalanche',      // destination chain name
    msg.value         // gas sent for token deployment
);
```
### Key Details:
- **Original Chain Name**: The name of the chain where the token was originally deployed (e.g., "Ethereum").
- **Original Token Address**: The address of the token registered as canonical on the home chain.
- **Destination Chain Name**: The name of the chain where the token will be deployed (e.g., "Avalanche").
- **Gas Value**: The gas amount required for token deployment on the destination chain.

### The [`deployRemoteCanonicalInterchainToken`](https://github.com/axelarnetwork/interchain-token-service/blob/main/contracts/InterchainTokenFactory.sol#L257) Function:
- **Deploys** a token connected to your registered token on the home chain.
- **Makes** the token **bridgeable** to the destination chain.
- **Returns** a unique **token ID**.

### Summary

With ITS, you can seamlessly:

- **Register** your existing ERC-20 tokens as **Canonical Tokens**.
- **Deploy** their remote counterparts on other blockchains.

This enables **interoperability** and **cross-chain functionality**, allowing your token to be **bridgeable** across multiple chains.
