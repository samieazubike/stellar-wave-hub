# Research: Sorokit

## Project Name

Sorokit

## Category

Developer Tooling (UI/Frontend)

## Tags

soroban, react, ui-kit, frontend, stellar, wallet-connection, components, tailwind

## Links

- Repo (Wave-approved): https://github.com/Sorokit/ui
- Built on: shadcn/ui, Radix primitives

## Verified Stellar/Soroban identifier

**Contract / Account ID:**
As a frontend UI Kit and presentation layer, Sorokit does not deploy its own smart contracts to the Stellar mainnet. Instead, it serves as a utility library for developers to connect their own Soroban contract IDs and Stellar Account IDs. Integrations connect to the network using standard wallet adapters (like Freighter) and interact with arbitrary `Contract ID`s provided by the developers.

## Original description

Sorokit is a specialized, open-source React UI kit built specifically to accelerate the development of Stellar and Soroban-based applications. In the rapidly evolving Web3 ecosystem, frontend development can often become a bottleneck, as teams repeatedly build similar components for wallet connections, transaction signing, and account displays. Sorokit addresses this friction by providing a suite of drop-in, highly customizable UI primitives. 

Built on top of robust modern web technologies like shadcn/ui, Tailwind CSS, and Radix primitives, the library is strictly a presentation layer. This means it intentionally avoids bundling complex blockchain logic, allowing developers to maintain clean separation of concerns. It seamlessly integrates with underlying connection layers like `sorokit-core`, enabling developers to easily construct intuitive and responsive user interfaces for decentralized applications (dApps).

By using Sorokit, developers can significantly reduce their time-to-market. Instead of grappling with the nuances of UI state management for Stellar interactions—such as handling wallet connection states, network switching, and transaction feedback—they can leverage Sorokit's pre-built components. The project is actively maintained on GitHub, participating in the Stellar Wave program, and continually expanding its library with components like `AddressDisplay`, `TopBar`, and `Sidebar` to meet the diverse needs of the Stellar developer community.

## Problem it solves

Building high-quality, accessible user interfaces for blockchain applications is notoriously time-consuming. Developers frequently reinvent the wheel for common components like wallet connection modals, account address formatting, and transaction status indicators. Sorokit solves this by offering a minimal, pre-styled (yet fully customizable) React UI kit tailored for the Stellar ecosystem. It allows teams to focus on their dApp's core business logic and smart contract interactions rather than spending weeks perfecting standard Web3 UI elements.

## How it uses Stellar

- **Wallet Integration:** Sorokit provides components that interface with Stellar wallets (like Freighter), facilitating smooth user authentication and transaction signing processes.
- **Soroban Interactions:** The kit includes parameters and design patterns designed to accommodate Soroban contract invocations and data reads, making it easier to present complex smart contract interactions in a user-friendly manner.
- **Account & Network Management:** It offers dedicated UI elements for displaying Stellar Account IDs, handling network selection (e.g., Mainnet vs. Testnet), and formatting asset balances native to the Stellar network.

## Technical approach

- **Presentation-First:** Sorokit is strictly a presentation layer. It abstracts away the UI complexities but leaves the heavy lifting of blockchain communication to `sorokit-core` or the developer's preferred Stellar SDK.
- **Modern Tech Stack:** It leverages **shadcn/ui**, **Tailwind CSS**, and **Radix primitives**. This ensures that the components are not only visually appealing out of the box but also highly accessible and easily themeable to match any brand's design system.
- **Component-Based Architecture:** The library is modular, offering granular components like `AddressDisplay` and `TopBar`, allowing developers to import only what they need without bloating their application size.

## Team / community

Sorokit is an open-source project actively developed within the Stellar ecosystem and hosted on GitHub under the `Sorokit` organization. It is a participating project in the Stellar Wave program (often associated with Drips Wave), which incentivizes community contributions to its codebase. The project fosters collaboration through its public repository, where developers can report issues, request features, and contribute directly to the UI kit's expansion.

## Sources

1. https://github.com/Sorokit/ui (Main repository and documentation)
2. Stellar Wave Program listings and GitHub issues labeled with "Stellar Wave" for Sorokit.
3. Web search confirmations regarding Sorokit's tech stack (shadcn/ui, Tailwind CSS) and its role as a minimal React UI kit for Stellar.

## Screenshots

*(Note: As this is a UI tooling library, actual integration screens depend on the developer's implementation. A typical screenshot would showcase the component gallery or a demo app using the `TopBar` and `AddressDisplay` components connected to a Stellar wallet.)*
![Sorokit GitHub Repository](https://github.com/Sorokit/ui/raw/main/screenshot.png)
