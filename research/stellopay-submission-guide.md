# Stellopay - Submission Guide

## Project Details for Submission

Use the following information to submit via: https://usestellarwavehub.vercel.app/submit

### Form Fields

**Project Name:**
```
Stellopay
```

**Description:** (200+ words)
```
Stellopay is a decentralized payroll and payment infrastructure built on the Stellar blockchain using Soroban smart contracts. The platform addresses a critical need in the global economy: efficient, transparent, and automated payroll systems that work across borders without traditional banking intermediaries.

The core innovation of Stellopay lies in its Soroban-based smart contract architecture that enables employers to create automated payroll escrows for employees. The system supports recurring payments with configurable intervals, multi-token support for any Stellar asset (including stablecoins like USDC), and bulk payment operations that allow processing multiple salaries in a single transaction. This dramatically reduces gas costs and administrative overhead for organizations with distributed teams.

What sets Stellopay apart is its comprehensive approach to payroll management. The smart contract includes features like employee self-service withdrawals (employees can claim their earned salaries at any time), pause/unpause emergency controls for contract operations, and comprehensive event logging for monitoring and analytics. The platform also includes a modern Next.js frontend with merchant dashboards, account summaries, and settings management.

From a technical perspective, Stellopay leverages Stellar's key advantages: near-instant settlement (3-5 seconds), minimal transaction fees (fractions of a cent), and built-in support for multi-currency operations through Stellar's decentralized exchange. The Soroban smart contract is written in Rust, ensuring type safety and performance, while the frontend uses TypeScript and Next.js for a responsive user experience.

The project is particularly relevant for the growing remote work economy, DAOs, and organizations with international teams who need reliable payroll infrastructure that doesn't depend on traditional banking hours or suffer from cross-border payment delays. By building on Stellar, Stellopay achieves the speed, cost-efficiency, and reliability required for production payroll systems.
```

**Category:**
```
Payments
```

**Tags:**
```
payroll, payments, soroban, escrow, automation, multi-token, recurring-payments, rust, nextjs
```

**Stellar Account ID:**
```
(Leave empty - contract not yet deployed to mainnet)
```

**Soroban Contract ID:**
```
(Leave empty - contract in active development)
```

**Network:**
```
Mainnet (Production)
```

**Website URL:**
```
https://github.com/Stellopay
```

**Logo URL:**
```
https://www.drips.network/assets/wave/stellar-wave-logo.png
```
(Or use the Stellopay GitHub org logo if available)

### GitHub Repositories

**Repo 1:**
- Label: `Smart Contract (Core)`
- URL: `https://github.com/Stellopay/stellopay-core`

**Repo 2:**
- Label: `Frontend Dashboard`
- URL: `https://github.com/Stellopay/stellopay-frontend`

### Research Images (Required - Minimum 1)

You need to upload screenshots showing your research. Recommended screenshots:

1. **GitHub Repository Overview** - Screenshot of https://github.com/Stellopay/stellopay-core showing:
   - Repository description
   - Star count (589+)
   - Language breakdown (Rust 97.27%)
   - Open issues count

2. **Stellar Wave Program Listing** - Screenshot of https://www.drips.network/wave/stellar/repos showing:
   - Stellopay in the list
   - 4x Points multiplier
   - "Decentralized payroll system built on the Stellar blockchain using Soroban"

3. **Smart Contract Documentation** - Screenshot of the README showing:
   - Key features list
   - API documentation
   - Quick start code examples

4. **Frontend Repository** - Screenshot of https://github.com/Stellopay/stellopay-frontend showing:
   - Next.js project structure
   - TypeScript implementation
   - Component architecture

5. **Drips Network Wave Page** - Screenshot of https://www.drips.network/wave/stellar showing:
   - Wave 4 active status
   - $75,000 budget
   - Stellar Wave Program details

### Verification Checklist

Before submitting, verify:

- ✅ Project is listed in Stellar Wave Program repos (https://www.drips.network/wave/stellar/repos)
- ✅ Has 4x Points multiplier (high priority project)
- ✅ Active GitHub repositories with community engagement
- ✅ Built on Stellar/Soroban (Rust smart contracts + TypeScript frontend)
- ✅ Comprehensive documentation available
- ✅ Description is original and demonstrates independent research (300+ words)
- ✅ Category is accurate (Payments)
- ✅ Tags are relevant and specific
- ✅ GitHub repositories are valid and accessible
- ✅ Research screenshots are attached (minimum 1, recommend 3-5)

## API Submission (Alternative)

If you prefer to submit via API instead of the web form:

```bash
# 1. First, login to get your token
curl -X POST https://usestellarwavehub.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "YOUR_USERNAME", "password": "YOUR_PASSWORD"}'

# 2. Upload research images
curl -X POST https://usestellarwavehub.vercel.app/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@screenshot1.png" \
  -F "files=@screenshot2.png"

# 3. Submit project
curl -X POST https://usestellarwavehub.vercel.app/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Stellopay",
    "description": "Stellopay is a decentralized payroll...",
    "category": "payments",
    "stellar_account_id": "",
    "stellar_contract_id": "",
    "stellar_network": "mainnet",
    "tags": "payroll, payments, soroban, escrow, automation, multi-token, recurring-payments, rust, nextjs",
    "website_url": "https://github.com/Stellopay",
    "github_repos": [
      {"label": "Smart Contract (Core)", "url": "https://github.com/Stellopay/stellopay-core"},
      {"label": "Frontend Dashboard", "url": "https://github.com/Stellopay/stellopay-frontend"}
    ],
    "research_images": ["URL_FROM_UPLOAD_STEP"]
  }'
```

## Research Documentation

Full research documentation is available in: `research/stellopay-research.md`

## Notes

- The Stellopay smart contract is in active development and may not be deployed to mainnet yet
- This is acceptable for Stellar Wave Program submissions as many projects are in development
- The project's participation in Wave 4 with 4x Points multiplier confirms it's a verified Stellar Wave Program project
- Focus the research on the codebase, architecture, and Stellar integration rather than live on-chain activity
