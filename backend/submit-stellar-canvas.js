/**
 * Script to submit StellarCanvas project to Stellar Wave Hub
 * Run this after setting up the backend with: node submit-stellar-canvas.js
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './data/stellar_wave_hub.db';

const projectData = {
  name: "StellarCanvas",
  slug: "stellar-canvas",
  description: "StellarCanvas is a Soroban-based smart contract deployed on the Stellar Testnet that enables a decentralized NFT gallery experience. It allows users to mint, store, transfer, and manage NFTs directly on-chain, with lightweight and efficient contract logic optimized for the Stellar ecosystem.",
  long_description: `StellarCanvas is a pioneering NFT platform built on Stellar's Soroban smart contracts, representing a significant advancement in digital ownership on the Stellar blockchain. This project demonstrates the power of Soroban for creating decentralized, secure, and efficient NFT applications.

## Key Features

### NFT Minting with Metadata Support
StellarCanvas allows users to mint NFTs with associated metadata, supporting IPFS links or JSON data for rich digital asset descriptions. The minting process is streamlined and cost-effective, leveraging Stellar's low fees.

### On-Chain Ownership Tracking
All NFT ownership data is stored securely on the Stellar blockchain, ensuring immutability and transparency. Users can verify ownership at any time through the smart contract.

### Secure Transfer Mechanism
The platform implements an approval-based transfer model (similar to ERC-721), allowing NFT owners to approve third parties or contracts to manage transfers. This provides flexibility while maintaining security.

### Global NFT Gallery View
Users can browse a global gallery of all NFTs minted on the platform, creating a decentralized marketplace experience.

## Technical Implementation

### Soroban Smart Contract
The project uses Rust-based Soroban smart contracts, which provide:
- Efficient on-chain storage for NFT metadata
- Deterministic execution environment
- Low gas fees compared to Ethereum-based NFTs
- Native integration with Stellar's existing infrastructure

### Contract ID
The main smart contract is deployed at:
CBKWKQIABVDY66ASDMABZVV66HC3B6DHRW6A2KCQBXZ5F2NL4I7UDMGZ

### User Experience
1. **Connect Wallet**: Users connect using Stellar-compatible wallets like Freighter
2. **Mint NFT**: Users upload metadata (IPFS hash or JSON) and mint their digital artwork
3. **View Gallery**: Browse all minted NFTs in a decentralized gallery
4. **Transfer**: Securely transfer NFTs to other Stellar addresses

## Digital Ownership Model

StellarCanvas leverages Stellar's unique approach to digital ownership:

1. **True Ownership**: Unlike centralized platforms, users have complete control over their digital assets through their Stellar secret key
2. **No Intermediaries**: Peer-to-peer transactions without marketplace fees
3. **Interoperability**: Built on Stellar means compatibility with the broader Stellar ecosystem
4. **Sustainability**: Energy-efficient proof-of-stake consensus

This project is ideal for creators, collectors, and developers looking to explore NFT possibilities on Stellar.`,
  category: "nft",
  repo_url: "https://github.com/PrithwishDas101/stellar-canvas",
  live_url: "https://stellar-canvas-demo.vercel.app",
  logo_url: null,
  banner_url: null,
  stellar_contract_id: "CBKWKQIABVDY66ASDMABZVV66HC3B6DHRW6A2KCQBXZ5F2NL4I7UDMGZ",
  stellar_account_id: null,
  tags: ["nft", "digital-assets", "soroban", "smart-contracts", "stellar", "digital-collectibles", "web3"]
};

async function submitProject() {
  const db = new Database(DB_PATH);
  
  try {
    // Initialize database schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL,
        avatar_url TEXT,
        role TEXT NOT NULL DEFAULT 'contributor' CHECK(role IN ('contributor', 'admin')),
        stellar_address TEXT,
        github_url TEXT,
        bio TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        long_description TEXT,
        category TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'featured')),
        repo_url TEXT,
        live_url TEXT,
        logo_url TEXT,
        banner_url TEXT,
        stellar_contract_id TEXT,
        stellar_account_id TEXT,
        tags TEXT,
        submitted_by INTEGER NOT NULL,
        approved_by INTEGER,
        approved_at DATETIME,
        rejection_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (submitted_by) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      );
    `);

    // Check if a test user exists
    let user = db.prepare('SELECT id FROM users WHERE username = ?').get('testuser');
    
    if (!user) {
      // Create a test user
      const password_hash = bcrypt.hashSync('testpassword123', 12);
      const result = db.prepare(`
        INSERT INTO users (username, email, password_hash, display_name, role)
        VALUES (?, ?, ?, ?, ?)
      `).run('testuser', 'test@example.com', password_hash, 'Test User', 'contributor');
      user = { id: result.lastInsertRowid };
    }

    // Check if project already exists
    const existing = db.prepare('SELECT id FROM projects WHERE slug = ?').get(projectData.slug);
    if (existing) {
      console.log('Project already exists!');
      return;
    }

    // Insert the project
    const result = db.prepare(`
      INSERT INTO projects (name, slug, description, long_description, category, repo_url, live_url, logo_url, banner_url, stellar_contract_id, stellar_account_id, tags, submitted_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')
    `).run(
      projectData.name,
      projectData.slug,
      projectData.description,
      projectData.long_description,
      projectData.category,
      projectData.repo_url,
      projectData.live_url,
      projectData.logo_url,
      projectData.banner_url,
      projectData.stellar_contract_id,
      projectData.stellar_account_id,
      JSON.stringify(projectData.tags),
      user.id
    );

    console.log('Project submitted successfully!');
    console.log('Project ID:', result.lastInsertRowid);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    db.close();
  }
}

submitProject();
