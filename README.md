# AXELAR Interchain Tokens Solution (ITS)

<ul>
<li><a href="#Overview">Overview</a></li>
<li><a href="#Getting-started">Getting started</a></li>
<li><a href="#No-Code-(ITS-Portal)">Create a new Interchain token</a></li>
<li><a href="#Create-New-Token">Programmatically Create New Interchain Token</a></li>
<li><a href="#Register-Existing-Token">Make an existing ERC-20 token an Interchain Token</a></li>
<li><a href="#Interchain-Portal">Check out the Interchain Portal</a></li>
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


## No-Code (ITS Portal)

The quickest way to explore and deploy interchain tokens is with Axelar’s **no-code frontend portal**.  
[**Click here for the testnet**](#)

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
