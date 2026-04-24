#!/usr/bin/env node

/**
 * Stellopay Project Submission Script
 * 
 * This script submits the Stellopay project to Stellar Wave Hub via the API.
 * 
 * Usage:
 * 1. Make sure you're logged in to Stellar Wave Hub
 * 2. Get your auth token from browser dev tools or login via the API
 * 3. Run: node submit-stellopay.js YOUR_AUTH_TOKEN
 * 
 * Note: You still need to manually upload research images first via the web interface
 * or use the /api/upload endpoint separately.
 */

const TOKEN = process.argv[2];

if (!TOKEN) {
  console.error('Usage: node submit-stellopay.js <AUTH_TOKEN>');
  console.error('\nGet your auth token by:');
  console.error('1. Logging in to Stellar Wave Hub');
  console.error('2. Opening browser dev tools (F12)');
  console.error('3. Going to Application/Storage tab');
  console.error('4. Finding the auth token in cookies or localStorage');
  process.exit(1);
}

const submissionData = {
  name: "Stellopay",
  description: `Stellopay is a decentralized payroll and payment infrastructure built on the Stellar blockchain using Soroban smart contracts. The platform addresses a critical need in the global economy: efficient, transparent, and automated payroll systems that work across borders without traditional banking intermediaries.

The core innovation of Stellopay lies in its Soroban-based smart contract architecture that enables employers to create automated payroll escrows for employees. The system supports recurring payments with configurable intervals, multi-token support for any Stellar asset (including stablecoins like USDC), and bulk payment operations that allow processing multiple salaries in a single transaction. This dramatically reduces gas costs and administrative overhead for organizations with distributed teams.

What sets Stellopay apart is its comprehensive approach to payroll management. The smart contract includes features like employee self-service withdrawals (employees can claim their earned salaries at any time), pause/unpause emergency controls for contract operations, and comprehensive event logging for monitoring and analytics. The platform also includes a modern Next.js frontend with merchant dashboards, account summaries, and settings management.

From a technical perspective, Stellopay leverages Stellar's key advantages: near-instant settlement (3-5 seconds), minimal transaction fees (fractions of a cent), and built-in support for multi-currency operations through Stellar's decentralized exchange. The Soroban smart contract is written in Rust, ensuring type safety and performance, while the frontend uses TypeScript and Next.js for a responsive user experience.

The project is particularly relevant for the growing remote work economy, DAOs, and organizations with international teams who need reliable payroll infrastructure that doesn't depend on traditional banking hours or suffer from cross-border payment delays. By building on Stellar, Stellopay achieves the speed, cost-efficiency, and reliability required for production payroll systems.`,
  category: "payments",
  stellar_account_id: "",
  stellar_contract_id: "",
  stellar_network: "mainnet",
  tags: "payroll, payments, soroban, escrow, automation, multi-token, recurring-payments, rust, nextjs",
  website_url: "https://github.com/Stellopay",
  logo_url: "",
  github_repos: [
    {
      label: "Smart Contract (Core)",
      url: "https://github.com/Stellopay/stellopay-core"
    },
    {
      label: "Frontend Dashboard",
      url: "https://github.com/Stellopay/stellopay-frontend"
    }
  ],
  // Note: research_images should be URLs returned from /api/upload endpoint
  // You need to upload images first and replace this array with the actual URLs
  research_images: []
};

async function submitProject() {
  console.log('🚀 Submitting Stellopay project to Stellar Wave Hub...\n');

  if (submissionData.research_images.length === 0) {
    console.warn('⚠️  WARNING: No research images provided!');
    console.warn('You must upload research images first via the web interface or /api/upload endpoint.\n');
    console.warn('Recommended screenshots to upload:');
    console.warn('1. GitHub repository overview (stellopay-core)');
    console.warn('2. Stellar Wave Program listing (drips.network)');
    console.warn('3. Smart contract documentation');
    console.warn('4. Frontend repository structure\n');
    
    const proceed = process.argv[3] === '--force';
    if (!proceed) {
      console.log('To force submission without images, run: node submit-stellopay.js <TOKEN> --force');
      process.exit(0);
    }
  }

  try {
    const response = await fetch('https://usestellarwavehub.vercel.app/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(submissionData)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Project submitted successfully!');
      console.log('\nProject Details:');
      console.log(`  ID: ${data.project.numericId}`);
      console.log(`  Name: ${data.project.name}`);
      console.log(`  Slug: ${data.project.slug}`);
      console.log(`  Status: ${data.project.status}`);
      console.log(`  Created: ${data.project.created_at}`);
      console.log('\n📝 Next steps:');
      console.log('  1. Check your project at: /my-projects');
      console.log('  2. Wait for admin approval');
      console.log('  3. You\'ll be notified when approved\n');
    } else {
      console.error('❌ Submission failed!');
      console.error(`Error: ${data.error}`);
      console.error(`Status: ${response.status}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Network error occurred!');
    console.error(error.message);
    process.exit(1);
  }
}

submitProject();
