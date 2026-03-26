const Database = require('better-sqlite3');
const path = require('path');

// Connect to the SQLite database
const dbPath = path.join(__dirname, 'data', 'stellar_wave_hub.db');
console.log('Using database at:', dbPath);

try {
  const db = new Database(dbPath, { verbose: console.log });
  
  // 1. Ensure a user exists or insert one
  const userQuery = db.prepare('SELECT id FROM users LIMIT 1');
  let user = userQuery.get();
  
  if (!user) {
    console.log('No user found, creating a dummy user...');
    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, display_name)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = insertUser.run('rwa_submitter', 'rwa@example.com', 'hashedpassword', 'contributor', 'RWA Submitter');
    user = { id: result.lastInsertRowid };
  }
  
  console.log('Using user ID:', user.id);
  
  // 2. Insert the RWA project
  console.log('Inserting RWA project...');
  const insertProject = db.prepare(`
    INSERT INTO projects (
      name, slug, description, category, repo_url, live_url, logo_url, banner_url, 
      stellar_contract_id, stellar_account_id, tags, submitted_by, status, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
  `);
  
  const tagsStr = JSON.stringify(['rwa', 'tokenization', 'real-world-assets', 'treasury', 'money-market', 'defi']);
  const slug = 'franklin-templeton-benji-fobxx-' + Date.now();
  
  const projectResult = insertProject.run(
    'Franklin Templeton BENJI (FOBXX)',
    slug,
    'The Franklin OnChain U.S. Government Money Fund (FOBXX), represented by the BENJI token, is the first US-registered mutual fund to use a public blockchain to process transactions and record share ownership. It operates on the Stellar network to tokenize U.S. government securities, cash, and repurchase agreements, offering daily yield earnings recorded on-chain. This provides an efficient, regulated approach to traditional asset tokenization, bridging traditional finance with decentralized blockchain infrastructure.',
    'rwa',
    null, // repo_url
    'https://www.franklintempleton.com/', // live_url
    null, // logo_url
    null, // banner_url
    null, // contract
    'GBHNGLLIE3KWGKCHIKMHJ5HVZHYIK7WTBE4QF5PLAKL4CJGSEU7HZIW5', // account
    tagsStr,
    user.id,
    'submitted' // status
  );
  
  console.log('Project inserted successfully with ID:', projectResult.lastInsertRowid);
  
  db.close();
} catch (err) {
  console.error('Error inserting project into database:', err);
}
