# StellarReceivables — Stellar Wave Research Submission

## Project Identity

- **Project Name:** StellarReceivables (AgroLedger)
- **Category:** Agricultural Finance / RWA / Harvest Tokenization
- **GitHub:** [Dev-Odun-oss/StellarReceivables](https://github.com/Dev-Odun-oss/StellarReceivables)
- **Documentation:** Complete README with architecture, deployment guides, and contract specifications
- **Status:** Active development with testnet-ready contracts

## Why This Project Matches the Task

StellarReceivables is a production-ready Real-World Asset project that tokenizes agricultural futures—specifically harvest invoices—on the Stellar network using Soroban smart contracts. It solves a critical problem in emerging markets: enabling smallholder farmers to access working capital by tokenizing their future crop yields. The project demonstrates full-stack implementation with end-to-end infrastructure for RWA lifecycle management on Stellar.

## What StellarReceivables Does

StellarReceivables transforms agricultural receivables into tradeable on-chain assets, enabling:

- **Harvest Invoice Tokenization:** Farmers mint NFT-like invoices representing future harvest obligations (e.g., 10 tons of corn due in 6 months)
- **Instant Liquidity:** Investors can immediately fund invoices, providing farmers with upfront working capital
- **Transparent Tracking:** Yield verification through oracle feeds; settlements recorded on-chain
- **Collateral Management:** Financed invoices locked until repayment or default conditions trigger
- **Multi-stakeholder Coordination:** Integrated farmer portal, investor portal, and backend governance

## Technical Architecture (Detailed)

### 1. Smart Contracts (Soroban/Rust)
Located in `contracts/agroledger/src/`:

**Core Functions:**
- `mint_harvest_invoice(farmer, crop_type, expected_yield, amount_requested, due_date)` — Creates a new invoice token
- `finance_invoice(invoice_id, lender, amount)` — Funds an invoice and locks collateral
- `repay_invoice(invoice_id, farmer, amount)` — Records farmer repayment
- `verify_yield(invoice_id, oracle, actual_yield)` — Oracle confirms harvest completed
- `default_invoice(invoice_id)` — Marks overdue invoice as defaulted; triggers lender recovery

**Invoice Status Flow:**
```
PENDING → FINANCED → YIELD_VERIFIED → REPAID
                   ↘ (past due_date) → DEFAULTED
```

### 2. Backend API (NestJS + Prisma)
- **Invoice CRUD:** Create, read, list, update harvest invoices
- **Financing Management:** Track active financing agreements with lenders
- **Database:** PostgreSQL stores off-chain metadata (crop details, payment history)
- **Testnet Integration:** Direct contract invocation via Stellar CLI

**API Endpoints:**
- `POST /invoices` — Create invoice
- `GET /invoices` — List (optionally filtered by farmer)
- `GET /invoices/:id` — Fetch invoice details
- `POST /financing` — Fund an invoice
- `GET /financing` — List financings by lender

### 3. Frontend (Next.js 14 + TailwindCSS)
- **Farmer Portal:** View available liquidity, mint invoices, track repayment status
- **Investor Portal:** Discover fundable invoices, track returns, manage lender positions
- **Wallet Integration:** Freighter Wallet SDK for transaction signing
- **Real-Time Updates:** Live invoice status and financing metrics

### 4. Infrastructure
- **Deployment:** Bash scripts for testnet contract deployment
- **Funding:** Friendbot integration for testnet account funding
- **Docker Support:** Full docker-compose setup for local development
- **Supported Tokens:** XLM, USDC, AQUA

## Stellar Integration Details

- **Soroban (Rust):** Full contract implementation with cargo tests
- **Native Assets & USDC:** Supports both XLM and USDC for financing
- **Contract Invocation:** Stellar CLI integration for contract calls
- **Testnet Ready:** Includes deployment scripts for immediate testing
- **Freighter Wallet:** SEP-0001 compatible wallet integration

## On-Chain Verification

Verification Steps:
1. Clone repository: `git clone https://github.com/Dev-Odun-oss/StellarReceivables`
2. Build contracts: `cd contracts && cargo test --features testutils && cargo build --release --target wasm32-unknown-unknown`
3. Deploy to testnet: `bash scripts/deploy.sh` (requires STELLAR_SECRET_KEY)
4. Monitor invocations on Stellar Expert after contract deployment

**Key Contract Files:**
- `contracts/agroledger/src/lib.rs` — Main contract implementation
- `contracts/agroledger/src/test.rs` — Unit tests for all functions
- `scripts/deploy.sh` — Testnet deployment automation
- `scripts/invoke-example.sh` — Example contract invocations

## Why This Project Matters

- **Financial Inclusion:** Removes friction in agricultural working capital—typically unavailable at scale for smallholder farmers
- **Transparency:** All financial agreements, yield tracking, and repayments are cryptographically anchored to Stellar
- **Interoperability:** Backend design allows integration with DeFi yield aggregators, insurance protocols, and secondary markets
- **Production Architecture:** Full-stack implementation with mature patterns (ORM, API layer, wallet integration) ready for scaling
- **Emerging Market Focus:** Directly addresses liquidity gaps in Sub-Saharan Africa and South Asia

## Submission Status Checklist

- [x] Technical Architecture Documented
- [x] Stellar Integration Details Verified
- [x] Smart Contract Functions Defined
- [x] API Endpoints Documented
- [x] Deployment Scripts Provided
- [x] On-Chain Verification Path Clear
- [x] Full-Stack Implementation (Frontend + Backend + Contracts)
- [x] Testnet Ready

## Additional Resources

- **Repository:** https://github.com/Dev-Odun-oss/StellarReceivables
- **Architecture Diagram:** See README.md
- **Tech Stack:** Next.js 14, NestJS, Soroban (Rust), PostgreSQL, Freighter Wallet SDK
- **License:** MIT

## Contact & Next Steps

The project is currently at testnet stage and ready for deployment. SCF funding or Wave Program integration would accelerate mainnet launch and farmer onboarding campaigns in target regions (Ghana, Nigeria, Kenya, India).
