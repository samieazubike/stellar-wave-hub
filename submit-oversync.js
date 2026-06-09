const fetch = require('node-fetch');

const projectData = {
  name: "OverSync",
  description: "OverSync is a cross-chain token bridge between Ethereum and Stellar using a Hashed Timelock Contract (HTLC) mechanism inspired by 1inch Fusion+ architecture. It eliminates vulnerable validator-set bridges with cryptographic guarantees, addressing the 1.1B+ in bridge hacks. The project has live deployed contracts on both Sepolia (Ethereum testnet) and Stellar testnet with comprehensive documentation and a multi-layer refund mechanism.",
  category: "infrastructure",
  stellar_contract_id: "CDIKSJKVMXKGBRD3BBEBMF7Q4GQJ52ECU6R6G5HEKXKXVGGWK2CTA6JK",
  stellar_network: "testnet",
  tags: "cross-chain,bridge,htlc,soroban,ethereum,stellar,security,trustless,atomic-swaps,testnet,infrastructure,stellar-wave",
  github_url: "https://github.com/karagozemin/OverSync",
  github_repos: [
    { url: "https://github.com/karagozemin/OverSync", name: "karagozemin/OverSync" }
  ]
};

fetch('https://usestellarwavehub.vercel.app/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(projectData),
})
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
