//! WaveHubRegistry — Soroban smart contract for the Stellar Wave Hub
//!
//! On-chain registry of approved Stellar Wave Program projects with two fee
//! mechanisms (registration + rating) and admin-gated upgradability.
//!
//! ## Fees
//! - **Registration fee** — paid once per project when it's added.
//! - **Rating fee** — paid by a user every time they rate a project.
//!
//! ## Upgradability & Versioning
//! - The admin can swap out the contract's WASM bytecode by calling `upgrade`.
//! - The contract tracks its version using a semver string (e.g., "1.0.0").
//! - `upgrade_version` allows updating the version string and emits an event.
//!
//! # Public interface
//!
//! ## Admin-only
//! - `initialize(admin, token, reg_fee, rate_fee, version)` — one-time setup.
//! - `upgrade(admin, new_wasm_hash)` — swap contract WASM.
//! - `upgrade_version(admin, new_version)` — update the semver version string.
//! - `transfer_admin(admin, new_admin)` — hand off admin rights.
//! - `register_project(admin, project_id, account_id, payer)` — add project.
//! - `remove_project(admin, project_id)` — remove a project.
//! - `set_registration_fee(admin, amount)` / `set_rating_fee(admin, amount)`
//! - `set_treasury(admin, treasury)` / `withdraw_fees(admin)`
//!
//! ## User-facing
//! - `rate_project(user, project_id, score)` — charges rating fee, stores rating.
//!
//! ## Public reads
//! - `get_version()` — returns the semver version string.
//! - `get_wasm_version()` — returns the WASM upgrade counter.
//! - `is_registered(project_id)` / `get_account(project_id)` / `get_projects()`
//! - `get_registration_fee()` / `get_rating_fee()`
//! - `get_rating(user, project_id)` / `get_project_rating(project_id)`
//! - `has_rated(user, project_id)` / `get_treasury_balance()` / `get_admin()`

#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, BytesN,
    Env, String, Symbol, Vec,
};

// ── Storage keys ────────────────────────────────────────────────────────────

const ADMIN_KEY: Symbol = symbol_short!("ADMIN");
const PROJECTS_KEY: Symbol = symbol_short!("PROJECTS");
const TOKEN_KEY: Symbol = symbol_short!("TOKEN");
const REG_FEE_KEY: Symbol = symbol_short!("REG_FEE");
const RATE_FEE_KEY: Symbol = symbol_short!("RATE_FEE");
const TREASURY_KEY: Symbol = symbol_short!("TREASURY");
const COLLECTED_KEY: Symbol = symbol_short!("COLLECT");
const VERSION_KEY: Symbol = symbol_short!("VERSION");
const WASM_VERSION_KEY: Symbol = symbol_short!("WASM_VER");

// ── Types ───────────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub struct ProjectEntry {
    pub account_id: Address,
    pub registered_at: u64,
}

/// Running aggregate of ratings for a project. `sum / count` gives the mean.
#[contracttype]
#[derive(Clone)]
pub struct ProjectRating {
    pub count: u64,
    pub sum: u64,
}

/// Keys for persistent per-rating and per-project-rating storage.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Aggregate ratings for a project.
    ProjectRating(Symbol),
    /// Score a specific user has given a specific project (prevents double-rate).
    UserRating(Address, Symbol),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidFee = 4,
    ProjectAlreadyRegistered = 5,
    ProjectNotFound = 6,
    NothingToWithdraw = 7,
    InvalidScore = 8,
    AlreadyRated = 9,
}

// ── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct WaveHubRegistry;

#[contractimpl]
impl WaveHubRegistry {
    // ── Setup ───────────────────────────────────────────────────────────

    /// One-time initialization.
    ///
    /// * `admin`     — privileged address that can manage the registry.
    /// * `token`     — Soroban token contract used for fee payments.
    /// * `reg_fee`   — registration fee in token's smallest unit.
    /// * `rate_fee`  — rating fee in the same unit.
    /// * `version`   — initial contract version (semver string).
    pub fn initialize(
        env: Env,
        admin: Address,
        token: Address,
        reg_fee: i128,
        rate_fee: i128,
        version: String,
    ) {
        if env.storage().instance().has(&ADMIN_KEY) {
            panic_with_error(&env, Error::AlreadyInitialized);
        }
        if reg_fee < 0 || rate_fee < 0 {
            panic_with_error(&env, Error::InvalidFee);
        }

        validate_version(&version);

        env.storage().instance().set(&ADMIN_KEY, &admin);
        env.storage().instance().set(&TOKEN_KEY, &token);
        env.storage().instance().set(&REG_FEE_KEY, &reg_fee);
        env.storage().instance().set(&RATE_FEE_KEY, &rate_fee);
        env.storage().instance().set(&TREASURY_KEY, &admin);
        env.storage().instance().set(&COLLECTED_KEY, &0i128);
        env.storage().instance().set(&VERSION_KEY, &version);
        env.storage().instance().set(&WASM_VERSION_KEY, &1u32);

        let projects: Vec<Symbol> = Vec::new(&env);
        env.storage().instance().set(&PROJECTS_KEY, &projects);
    }

    // ── Upgradability (admin) ───────────────────────────────────────────

    /// Replace the contract's WASM bytecode.
    pub fn upgrade(env: Env, admin: Address, new_wasm_hash: BytesN<32>) {
        Self::require_admin(&env, &admin);
        admin.require_auth();
        env.deployer().update_current_contract_wasm(new_wasm_hash);

        // Bump WASM version counter.
        let v: u32 = env.storage().instance().get(&WASM_VERSION_KEY).unwrap_or(1);
        env.storage().instance().set(&WASM_VERSION_KEY, &(v + 1));
    }

    /// Update the semver version string. Emits a ContractUpgraded event.
    pub fn upgrade_version(env: Env, admin: Address, new_version: String) {
        Self::require_admin(&env, &admin);
        admin.require_auth();
        validate_version(&new_version);

        let old_version: String = env
            .storage()
            .instance()
            .get(&VERSION_KEY)
            .unwrap_or_else(|| String::from_str(&env, "0.0.0"));

        env.storage().instance().set(&VERSION_KEY, &new_version);

        env.events().publish(
            (Symbol::new(&env, "ContractUpgraded"),),
            (old_version, new_version),
        );
    }

    /// Transfer admin rights to a new address. Irrevocable.
    pub fn transfer_admin(env: Env, admin: Address, new_admin: Address) {
        Self::require_admin(&env, &admin);
        admin.require_auth();
        env.storage().instance().set(&ADMIN_KEY, &new_admin);
    }

    // ── Project management (admin) ──────────────────────────────────────

    /// Register a project on-chain. `payer` pays the registration fee.
    pub fn register_project(
        env: Env,
        admin: Address,
        project_id: Symbol,
        account_id: Address,
        payer: Address,
    ) {
        Self::require_admin(&env, &admin);
        admin.require_auth();
        payer.require_auth();

        if env.storage().persistent().has(&project_id) {
            panic_with_error(&env, Error::ProjectAlreadyRegistered);
        }

        let fee = Self::get_registration_fee(env.clone());
        if fee > 0 {
            Self::collect_fee(&env, &payer, fee);
        }

        let entry = ProjectEntry {
            account_id,
            registered_at: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&project_id, &entry);

        let mut projects: Vec<Symbol> = env
            .storage()
            .instance()
            .get(&PROJECTS_KEY)
            .unwrap_or_else(|| Vec::new(&env));
        projects.push_back(project_id);
        env.storage().instance().set(&PROJECTS_KEY, &projects);
    }

    /// Remove a project from the registry. No fee refund.
    pub fn remove_project(env: Env, admin: Address, project_id: Symbol) {
        Self::require_admin(&env, &admin);
        admin.require_auth();

        if !env.storage().persistent().has(&project_id) {
            panic_with_error(&env, Error::ProjectNotFound);
        }
        env.storage().persistent().remove(&project_id);

        let projects: Vec<Symbol> = env
            .storage()
            .instance()
            .get(&PROJECTS_KEY)
            .unwrap_or_else(|| Vec::new(&env));
        let mut updated: Vec<Symbol> = Vec::new(&env);
        for pid in projects.iter() {
            if pid != project_id {
                updated.push_back(pid);
            }
        }
        env.storage().instance().set(&PROJECTS_KEY, &updated);
    }

    // ── Rating (user-facing) ────────────────────────────────────────────

    /// Rate a registered project. Charges the user the rating fee.
    pub fn rate_project(env: Env, user: Address, project_id: Symbol, score: u32) {
        user.require_auth();

        if !env.storage().persistent().has(&project_id) {
            panic_with_error(&env, Error::ProjectNotFound);
        }
        if score < 1 || score > 5 {
            panic_with_error(&env, Error::InvalidScore);
        }

        let ur_key = DataKey::UserRating(user.clone(), project_id.clone());
        if env.storage().persistent().has(&ur_key) {
            panic_with_error(&env, Error::AlreadyRated);
        }

        let fee = Self::get_rating_fee(env.clone());
        if fee > 0 {
            Self::collect_fee(&env, &user, fee);
        }

        env.storage().persistent().set(&ur_key, &score);

        let pr_key = DataKey::ProjectRating(project_id);
        let mut rating: ProjectRating = env
            .storage()
            .persistent()
            .get(&pr_key)
            .unwrap_or(ProjectRating { count: 0, sum: 0 });
        rating.count += 1;
        rating.sum += score as u64;
        env.storage().persistent().set(&pr_key, &rating);
    }

    // ── Fee management (admin) ──────────────────────────────────────────

    pub fn set_registration_fee(env: Env, admin: Address, amount: i128) {
        Self::require_admin(&env, &admin);
        admin.require_auth();
        if amount < 0 {
            panic_with_error(&env, Error::InvalidFee);
        }
        env.storage().instance().set(&REG_FEE_KEY, &amount);
    }

    pub fn set_rating_fee(env: Env, admin: Address, amount: i128) {
        Self::require_admin(&env, &admin);
        admin.require_auth();
        if amount < 0 {
            panic_with_error(&env, Error::InvalidFee);
        }
        env.storage().instance().set(&RATE_FEE_KEY, &amount);
    }

    pub fn set_treasury(env: Env, admin: Address, treasury: Address) {
        Self::require_admin(&env, &admin);
        admin.require_auth();
        env.storage().instance().set(&TREASURY_KEY, &treasury);
    }

    /// Withdraw all collected fees to the treasury.
    pub fn withdraw_fees(env: Env, admin: Address) -> i128 {
        Self::require_admin(&env, &admin);
        admin.require_auth();

        let collected: i128 = env
            .storage()
            .instance()
            .get(&COLLECTED_KEY)
            .unwrap_or(0i128);

        if collected <= 0 {
            panic_with_error(&env, Error::NothingToWithdraw);
        }

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&TOKEN_KEY)
            .unwrap_or_else(|| panic_with_error(&env, Error::NotInitialized));
        let treasury: Address = env
            .storage()
            .instance()
            .get(&TREASURY_KEY)
            .unwrap_or_else(|| panic_with_error(&env, Error::NotInitialized));

        let client = token::Client::new(&env, &token_addr);
        client.transfer(&env.current_contract_address(), &treasury, &collected);

        env.storage().instance().set(&COLLECTED_KEY, &0i128);
        collected
    }

    // ── Public queries ──────────────────────────────────────────────────

    pub fn get_version(env: Env) -> String {
        env.storage()
            .instance()
            .get(&VERSION_KEY)
            .unwrap_or_else(|| String::from_str(&env, "0.0.0"))
    }

    pub fn get_wasm_version(env: Env) -> u32 {
        env.storage().instance().get(&WASM_VERSION_KEY).unwrap_or(1)
    }

    pub fn is_registered(env: Env, project_id: Symbol) -> bool {
        env.storage().persistent().has(&project_id)
    }

    pub fn get_account(env: Env, project_id: Symbol) -> Address {
        let entry: ProjectEntry = env
            .storage()
            .persistent()
            .get(&project_id)
            .unwrap_or_else(|| panic_with_error(&env, Error::ProjectNotFound));
        entry.account_id
    }

    pub fn get_projects(env: Env) -> Vec<Symbol> {
        env.storage()
            .instance()
            .get(&PROJECTS_KEY)
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&ADMIN_KEY)
            .unwrap_or_else(|| panic_with_error(&env, Error::NotInitialized))
    }

    pub fn get_registration_fee(env: Env) -> i128 {
        env.storage().instance().get(&REG_FEE_KEY).unwrap_or(0i128)
    }

    pub fn get_rating_fee(env: Env) -> i128 {
        env.storage().instance().get(&RATE_FEE_KEY).unwrap_or(0i128)
    }

    pub fn get_treasury_balance(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&COLLECTED_KEY)
            .unwrap_or(0i128)
    }

    pub fn has_rated(env: Env, user: Address, project_id: Symbol) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::UserRating(user, project_id))
    }

    pub fn get_rating(env: Env, user: Address, project_id: Symbol) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::UserRating(user, project_id))
            .unwrap_or(0)
    }

    pub fn get_project_rating(env: Env, project_id: Symbol) -> ProjectRating {
        env.storage()
            .persistent()
            .get(&DataKey::ProjectRating(project_id))
            .unwrap_or(ProjectRating { count: 0, sum: 0 })
    }

    // ── Internals ───────────────────────────────────────────────────────

    fn require_admin(env: &Env, caller: &Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN_KEY)
            .unwrap_or_else(|| panic_with_error(env, Error::NotInitialized));
        if *caller != admin {
            panic_with_error(env, Error::Unauthorized);
        }
    }

    fn collect_fee(env: &Env, payer: &Address, fee: i128) {
        let token_addr: Address = env
            .storage()
            .instance()
            .get(&TOKEN_KEY)
            .unwrap_or_else(|| panic_with_error(env, Error::NotInitialized));
        let client = token::Client::new(env, &token_addr);
        client.transfer(payer, &env.current_contract_address(), &fee);

        let collected: i128 = env
            .storage()
            .instance()
            .get(&COLLECTED_KEY)
            .unwrap_or(0i128);
        env.storage()
            .instance()
            .set(&COLLECTED_KEY, &(collected + fee));
    }
}

fn panic_with_error(env: &Env, err: Error) -> ! {
    soroban_sdk::panic_with_error!(env, err);
}

fn validate_version(version: &String) {
    let len = version.len() as usize;
    if len == 0 || len > 32 {
        panic!("invalid version length");
    }

    let mut buf = [0u8; 32];
    version.copy_into_slice(&mut buf[..len]);

    let mut dot_count = 0;
    let mut part_len = 0;

    for i in 0..len {
        let b = buf[i];
        if b == b'.' {
            if part_len == 0 {
                panic!("invalid version format");
            }
            dot_count += 1;
            part_len = 0;
        } else if b >= b'0' && b <= b'9' {
            part_len += 1;
        } else {
            panic!("invalid version characters");
        }
    }

    if dot_count != 2 || part_len == 0 {
        panic!("invalid version format");
    }
}

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{
        symbol_short,
        testutils::{Address as _, Ledger},
        Env,
    };

    const REG_FEE: i128 = 5_000_000;
    const RATE_FEE: i128 = 1_000_000;

    fn setup_token(env: &Env, admin: &Address) -> Address {
        let token_id = env.register_stellar_asset_contract_v2(admin.clone());
        token_id.address()
    }

    fn fund(env: &Env, token_addr: &Address, to: &Address, amount: i128) {
        let sac_admin = token::StellarAssetClient::new(env, token_addr);
        sac_admin.mint(to, &amount);
    }

    #[test]
    fn test_full_lifecycle() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_timestamp(1_000_000);

        let contract_id = env.register_contract(None, WaveHubRegistry);
        let client = WaveHubRegistryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let token_addr = setup_token(&env, &admin);
        let payer = Address::generate(&env);
        fund(&env, &token_addr, &payer, 100_000_000);

        let version = String::from_str(&env, "1.0.0");
        client.initialize(&admin, &token_addr, &REG_FEE, &RATE_FEE, &version);

        assert_eq!(client.get_registration_fee(), REG_FEE);
        assert_eq!(client.get_rating_fee(), RATE_FEE);
        assert_eq!(client.get_admin(), admin);
        assert_eq!(client.get_version(), version);
        assert_eq!(client.get_wasm_version(), 1);

        let project_account = Address::generate(&env);
        let project_id = symbol_short!("proj1");
        client.register_project(&admin, &project_id, &project_account, &payer);

        assert!(client.is_registered(&project_id));
        assert_eq!(client.get_account(&project_id), project_account);
        assert_eq!(client.get_treasury_balance(), REG_FEE);

        let token_client = token::Client::new(&env, &token_addr);
        assert_eq!(token_client.balance(&payer), 100_000_000 - REG_FEE);

        client.withdraw_fees(&admin);
        assert_eq!(token_client.balance(&admin), REG_FEE);
        assert_eq!(client.get_treasury_balance(), 0);
    }

    #[test]
    fn test_upgrade_version() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, WaveHubRegistry);
        let client = WaveHubRegistryClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let token_addr = setup_token(&env, &admin);

        client.initialize(
            &admin,
            &token_addr,
            &0,
            &0,
            &String::from_str(&env, "1.0.0"),
        );
        assert_eq!(client.get_version(), String::from_str(&env, "1.0.0"));

        let new_version = String::from_str(&env, "1.1.0");
        client.upgrade_version(&admin, &new_version);
        assert_eq!(client.get_version(), new_version);
    }

    #[test]
    #[should_panic(expected = "invalid version format")]
    fn test_invalid_version_panics() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, WaveHubRegistry);
        let client = WaveHubRegistryClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let token_addr = setup_token(&env, &admin);

        client.initialize(&admin, &token_addr, &0, &0, &String::from_str(&env, "1.0"));
    }

    #[test]
    fn test_rate_project() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, WaveHubRegistry);
        let client = WaveHubRegistryClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let token_addr = setup_token(&env, &admin);
        let user = Address::generate(&env);
        let payer = Address::generate(&env);
        fund(&env, &token_addr, &user, 100_000_000);
        fund(&env, &token_addr, &payer, 100_000_000);

        client.initialize(
            &admin,
            &token_addr,
            &0,
            &RATE_FEE,
            &String::from_str(&env, "1.0.0"),
        );

        let pid = symbol_short!("proj");
        client.register_project(&admin, &pid, &Address::generate(&env), &payer);

        client.rate_project(&user, &pid, &5);
        assert!(client.has_rated(&user, &pid));
        assert_eq!(client.get_rating(&user, &pid), 5);

        let agg = client.get_project_rating(&pid);
        assert_eq!(agg.count, 1);
        assert_eq!(agg.sum, 5);
    }
}
