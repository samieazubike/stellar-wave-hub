# Soter - Humanitarian Aid Distribution Platform

## Project Summary

**Soter** is a free, open-source platform that revolutionizes humanitarian aid distribution by leveraging the Stellar blockchain. It enables donors and NGOs to send aid directly to people in need without intermediaries, while maintaining recipient privacy and ensuring complete on-chain transparency. The platform combines Next.js frontend, NestJS backend, Soroban smart contracts, and AI-powered verification to create a trustless, efficient aid distribution system.

**Repository**: https://github.com/Pulsefy/Soter  
**License**: MIT  
**Organization**: Pulsefy  
**Contributors**: 140+  
**Network**: Stellar Testnet, Futurenet, and Mainnet

---

## Problem Statement

Current humanitarian aid systems suffer from critical inefficiencies:

1. **Intermediary Overhead**: NGOs, administrators, and middlemen consume significant portions of donated funds, reducing aid effectiveness
2. **Lack of Transparency**: Donors have no verifiable proof that funds reach intended recipients or how they're used
3. **Privacy Vulnerabilities**: Centralized systems expose beneficiary personal data to security risks and identity theft
4. **Verification Challenges**: Confirming recipient eligibility and needs without exposing sensitive information is difficult
5. **Geographic Barriers**: Traditional banking infrastructure limits direct support to crisis zones
6. **Impact Opacity**: Limited ability to track real-world outcomes of donations or measure effectiveness
7. **Distribution Inefficiency**: Manual processes slow aid delivery in time-critical situations

Soter addresses these gaps by creating a direct, transparent, privacy-respecting connection between donors and recipients on the Stellar blockchain.

---

## Solution: How Soter Works

### Core Workflow

1. **Donor/NGO Campaign Creation**
   - Create aid campaigns with specific goals and beneficiary criteria
   - Deposit funds into blockchain-backed escrow (multi-token support)
   - Generate distribution claim links

2. **AI Verification** (Privacy-Preserving)
   - Multi-method verification without exposing PII:
     - OTP-based verification (email/phone)
     - OCR-powered identity document verification
     - Face detection and liveness proof-of-life
     - Humanitarian needs assessment via AI
   - Verification data stored off-chain with hashed references

3. **Recipient Claim**
   - Recipients use Stellar wallet (Freighter, WalletConnect)
   - Connect to platform and verify eligibility
   - Receive funds directly via Soroban smart contract
   - Transaction immutably recorded on blockchain

4. **Transparency & Impact Tracking**
   - Real-time distribution maps (Leaflet.js visualization)
   - Blockchain explorer verification of transactions
   - Campaign analytics and impact metrics
   - Donor dashboard for campaign monitoring

### Key Differentiators

- **Direct Transfers**: Funds go directly to recipient wallets, eliminating intermediary fees
- **AI Verification**: Automated needs assessment while maintaining privacy
- **On-Chain Accountability**: Every transaction is immutably recorded on Stellar
- **Batch Operations**: Efficiently create and manage multiple aid packages
- **Mobile-First**: Native mobile app for low-connectivity environments
- **Multi-Token**: Support for various Stellar assets and tokens

---

## Technical Architecture

### Smart Contract Layer (Soroban)

**AidEscrow Contract** - The heart of on-chain aid distribution:

```
Core Contract Methods:
├── init(admin)                    - Initialize contract
├── fund(token, from, amount)      - Deposit funds into escrow
├── create_package(...)            - Create single aid package
├── batch_create_packages(...)     - Create multiple packages efficiently
├── claim(id)                      - Recipient claims allocated funds
├── disburse(id)                   - Admin manual disbursement
├── revoke(id)                     - Cancel package and unlock funds
├── get_version()                  - Contract version
└── migrate(new_version)           - Upgrade contract

Features:
- Multi-token support (native Stellar assets)
- Expiration-based lifecycle management
- Event-driven state transitions
- Batch operations for gas efficiency
- Versioning and migration support

Events:
- EscrowFunded, PackageCreated, PackageClaimed
- PackageDisbursed, PackageRevoked, BatchCreatedEvent
```

### Backend Architecture (NestJS)

- **Database**: PostgreSQL with Prisma ORM for relational data
- **Job Queue**: Bull (Redis-backed) for asynchronous processing
- **Blockchain Integration**: 
  - Stellar JS SDK for asset transfers
  - Soroban RPC for smart contract interaction
  - Adapter pattern (pluggable: Soroban/Mock)
- **Verification Pipeline**: Multi-step session-based flows
- **Observability**: Prometheus metrics, correlation IDs, detailed logging
- **Health Monitoring**: Real-time backend status checks

### Frontend (Next.js 16+)

- **Campaign Management**: Create, monitor, and manage aid distributions
- **Recipient Portal**: Streamlined claim interface with wallet integration
- **Distribution Maps**: Live visualization using Leaflet.js
- **Analytics Dashboard**: Real-time metrics and impact tracking
- **Wallet Integration**: Freighter API, WalletConnect v2 (SEP-7 support)
- **Tech Stack**: TypeScript, Tailwind CSS, React Query, Radix UI

### Mobile Application (Expo)

- **React Native** cross-platform deployment
- **Wallet Connectivity**: WalletConnect v2 integration
- **Health Diagnostics**: Runtime monitoring and troubleshooting
- **Offline Capability**: Progressive enhancement for low connectivity
- **Responsive Design**: Works across iOS, Android, and web

### AI Verification Service (FastAPI/Python)

- **Face Detection & Liveness**: Ensures real person, not synthetic
- **OCR Engine**: Extracts identity information from documents
- **Humanitarian Assessment**: AI evaluates needs based on criteria
- **PII Anonymization**: Verification without storing sensitive data
- **Async Processing**: Non-blocking verification flows

---

## Stellar Integration Details

### Blockchain Integration Points

1. **Network Support**
   - Testnet: Full integration for development and testing
   - Futurenet: Soroban smart contract testing environment
   - Mainnet: Production deployment with public network passphrase

2. **Wallet Standards**
   - **Freighter**: Direct integration for browser-based wallets
   - **WalletConnect v2**: Multi-chain wallet support
   - **SEP-7**: Transaction request protocol for improved UX

3. **Asset Support**
   - Native XLM (Stellar Lumens)
   - Custom Stellar assets issued by foundations or organizations
   - Multi-token escrow management

4. **Smart Contracts**
   - **Location**: `contracts/` directory in repository
   - **Language**: Rust with Soroban SDK
   - **RPC Endpoint**: Soroban-testnet.stellar.org (testnet)
   - **Contract State**: Tracks packages, funds, recipients, and events

### On-Chain Data Flow

```
Donor Deposits XLM
        ↓
[Stellar Payment] → AidEscrow Contract
        ↓
Contract Creates Package (recipient, amount, expiration)
        ↓
[Event: PackageCreated] → Backend Listener
        ↓
[Verification] → Off-chain AI Service
        ↓
Recipient Claims via Wallet
        ↓
[Smart Contract Execution] → Funds Transferred
        ↓
[Event: PackageClaimed] → Immutable Record
```

---

## Use Cases & Real-World Impact

### 1. Emergency Crisis Response
- NGOs rapidly deploy aid to earthquake, flood, or conflict zones
- Direct payments bypass bureaucratic delays
- Transparent tracking ensures accountability to donors

### 2. Refugee Support
- Verified individuals receive aid directly without traditional banking
- Privacy protection prevents identity exposure in hostile environments
- Batch operations handle thousands of beneficiaries efficiently

### 3. Microfinance & Community Development
- Direct capital to vulnerable populations
- AI assessment prevents aid misuse
- On-chain records enable impact measurement

### 4. Donor Transparency
- Real-time tracking of fund deployment
- Blockchain-verified delivery confirmation
- Campaign-specific ROI and impact metrics
- Tax-compliant donation records

---

## Project Statistics & Community

- **Total Contributors**: 140+
- **Repository Forks**: 193
- **Stars**: 25+
- **Primary Maintainers**: @Cedarich, @T-kesh, @Big-cedar
- **Active Development**: Recent commits within last 7 days
- **Quality Metrics**: 
  - ESLint zero-warning policy
  - 19+ smart contract tests
  - E2E backend tests
  - 98%+ type coverage (TypeScript strict mode)
  - Codecov integration

---

## Tech Stack Overview

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16+, TypeScript, Tailwind CSS, React Query | Campaign UI, recipient portal, distribution maps |
| **Backend** | NestJS, PostgreSQL, Prisma, Bull | API, verification orchestration, job queue |
| **Mobile** | Expo, React Native, WalletConnect | Cross-platform app, wallet integration |
| **Smart Contracts** | Rust, Soroban SDK, wasm32 | AidEscrow contract, fund management |
| **AI/ML** | FastAPI, Python, OpenCV, Tesseract | Verification, identity checking, needs assessment |
| **Blockchain** | Stellar SDK, Soroban RPC, Freighter API | Wallet connectivity, asset transfers, contract calls |
| **Infrastructure** | Docker, GitHub Actions, PostgreSQL, Redis | CI/CD, containerization, data persistence |

---

## Key Differentiators in Wave Ecosystem

1. **Innovative Funding Model**: Combines humanitarian mission with blockchain efficiency
2. **Privacy-Respecting Verification**: AI that doesn't compromise beneficiary safety
3. **Multi-Platform Reach**: Web and mobile for global accessibility
4. **Batch Operations**: Gas-optimized smart contracts for scale
5. **Complete Stack**: Full-featured platform, not just a contract or library
6. **Active Community**: 140+ contributors actively building
7. **Real-World Impact**: Deployed to real humanitarian use cases

---

## Security & Quality Assurance

### Testing Coverage
- Smart contract: 19+ test cases including edge cases and gas profiling
- Backend: E2E tests, critical flow tests, verification lifecycle tests
- Frontend: React Testing Library, component tests
- Mobile: 12+ passing HealthScreen tests
- AI Service: 8+ Pytest test cases

### Security Measures
- TypeScript strict mode for type safety
- Cargo audit for dependency vulnerabilities
- GitHub Actions security scanning
- Prisma ORM for SQL injection prevention
- API rate limiting and request validation
- Wallet signature verification
- Correlation ID tracking for request tracing

### Code Quality
- ESLint 9 with zero-warning policy
- Black + mypy for Python
- Prettier code formatting
- Conventional commits
- Git Flow branching strategy

---

## Getting Started & Deployment

### Local Development
```bash
# Clone repository
git clone https://github.com/Pulsefy/Soter.git
cd Soter

# Frontend
cd app/web && npm install && npm run dev

# Backend
cd ../backend && npm install && npm run start:dev

# Mobile
cd ../mobile && pnpm install && pnpm start

# Smart contract
cd ../../contracts && cargo build --target wasm32-unknown-unknown --release
```

### Deployment
- **Docker**: Full containerization for all services
- **Database**: PostgreSQL migrations via Prisma
- **Blockchain**: Contract deployment via Stellar CLI
- **CI/CD**: GitHub Actions automated testing and deployment

---

## Community & Contributing

**Getting Involved**:
- Open issues for feature requests and bug reports
- 193 forks indicate active community interest
- Conventional commit format encouraged
- MIT License allows commercial use and derivatives
- GitHub Discussions for architectural decisions

**Project Status**:
- Actively maintained with regular commits
- Recent features: testnet observability, batch operations, identity verification
- Next priorities: mainnet deployment, mobile improvements, NGO partnerships

---

## Conclusion

Soter represents a paradigm shift in humanitarian aid distribution by eliminating intermediaries, ensuring transparency, and protecting recipient privacy—all enabled by the Stellar blockchain. Its comprehensive technical implementation across web, mobile, and smart contracts makes it a complete solution for trustless, efficient aid delivery at scale.

By combining Soroban smart contracts, multi-platform applications, and AI-powered verification, Soter demonstrates the Stellar ecosystem's potential to solve real-world problems beyond finance. The project's active community, rigorous testing practices, and focus on both technology and human impact make it a standout contribution to the Stellar Wave Program.

**Category**: Infrastructure / Tools  
**Primary Use**: Humanitarian Aid Distribution via Blockchain  
**Stellar Integration**: Soroban Smart Contracts, Stellar SDK, Wallet Integration  
**Open Source**: Yes (MIT License)  
**Production Ready**: Beta (Testnet/Futurenet available, Mainnet ready)
