const axios = require('axios');

async function submitRWAProject() {
  const adminUrl = 'http://localhost:3000';
  
  try {
    console.log('Registering user...');
    const userPayload = {
      username: 'rwa_researcher_' + Date.now(),
      email: `researcher${Date.now()}@example.com`,
      password: 'password123',
    };
    
    let token;
    try {
      const regRes = await axios.post(`${adminUrl}/api/auth/register`, userPayload);
      token = regRes.data.token;
      console.log('User registered successfully');
    } catch (e) {
       console.error("Register Error details:", e.response?.data || e.message);
       return;
    }
    
    console.log('Submitting the RWA project...');
    const projectPayload = {
      name: 'Franklin Templeton BENJI (FOBXX)',
      description: 'The Franklin OnChain U.S. Government Money Fund (FOBXX), represented by the BENJI token, is the first US-registered mutual fund to use a public blockchain to process transactions and record share ownership. It operates on the Stellar network to tokenize U.S. government securities, cash, and repurchase agreements, offering daily yield earnings recorded on-chain. This provides an efficient, regulated approach to traditional asset tokenization, bridging traditional finance with decentralized blockchain infrastructure.',
      category: 'rwa',
      stellar_account_id: 'GBHNGLLIE3KWGKCHIKMHJ5HVZHYIK7WTBE4QF5PLAKL4CJGSEU7HZIW5',
      stellar_contract_id: '',
      tags: 'rwa, tokenization, real-world-assets, treasury, money-market, defi',
      website_url: 'https://www.franklintempleton.com/',
      github_url: '',
      logo_url: ''
    };
    
    try {
      const submitRes = await axios.post(`${adminUrl}/api/projects`, projectPayload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Project submitted successfully:', submitRes.data.project.id);
    } catch (e) {
       console.error("Submit Error details:", e.response?.data || e.message);
    }
  } catch (error) {
    console.error('Fatal Error:', error);
  }
}

submitRWAProject();
