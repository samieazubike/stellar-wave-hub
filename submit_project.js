const loginData = JSON.stringify({
  email: 'antigravity@gemini.com',
  password: 'SecurePassword123!'
});

const projectData = JSON.stringify({
  name: 'Akkuea',
  description: 'Akkuea is an innovative decentralized finance (DeFi) protocol and Real World Asset (RWA) platform built natively on the Stellar network. It leverages Soroban smart contracts to bridge traditional finance with decentralized rails, enabling seamless tokenization, trading, and lending of real-world assets. The platform provides a secure and transparent environment for users to gain exposure to off-chain yields while maintaining the speed and low transaction costs inherent to Stellar. By utilizing advanced on-chain governance and automated market-making algorithms, Akkuea empowers a global audience to participate in a democratized financial ecosystem. The team behind Akkuea actively contributes to the Stellar Wave Program, focusing on improving the open-source infrastructure and tooling required for seamless RWA integration on Soroban.',
  category: 'DeFi',
  stellar_account_id: 'GBAF6Z7O4Y6J4A5R7V4F6Z7O4Y6J4A5R7V4F6Z7O4Y6J4A5R7V4F', // Mock 56-char
  stellar_contract_id: 'CAQXXO34D4Q63BCHL3YYZ4Z5C77L3V3J3M2F6Z6E2A',
  tags: 'DeFi, RWA, Soroban'
});

async function run() {
  try {
    // 2. Login
    const loginRes = await fetch('https://usestellarwavehub.vercel.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: loginData
    });
    console.log('Login status:', loginRes.status);
    const loginBody = await loginRes.json();

    if (!loginBody.token) {
      console.log('No token received');
      return;
    }

    // 3. Submit Project
    const submitRes = await fetch('https://usestellarwavehub.vercel.app/api/projects', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginBody.token}`
      },
      body: projectData
    });
    console.log('Submit status:', submitRes.status);
    const submitBody = await submitRes.text();
    console.log('Submit body:', submitBody);

  } catch (err) {
    console.error(err);
  }
}

run();
