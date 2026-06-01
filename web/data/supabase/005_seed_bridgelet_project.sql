-- Seed: researched Stellar Wave Program project profile for Bridgelet
-- Run this after the base schema and previous migrations.

begin;

-- Create or reuse a neutral contributor account for curated research uploads.
with existing_user as (
  select "numericId"
  from public.users
  where username = 'stellar-wave-researcher'
), user_id_candidate as (
  select greatest(
    coalesce((select max("numericId") from public.users), 0),
    coalesce((select value from public.counters where name = 'users'), 0),
    24000
  ) + 1 as id
), inserted_user as (
  insert into public.users (
    "numericId",
    username,
    email,
    role,
    github_url,
    bio,
    auth_method,
    created_at
  )
  select
    id,
    'stellar-wave-researcher',
    null,
    'contributor',
    'https://github.com/bridgelet-org',
    'Curated Stellar Wave Hub research profile uploader.',
    'seed',
    '2026-06-01T00:00:00Z'::timestamptz
  from user_id_candidate
  where not exists (select 1 from existing_user)
  returning "numericId"
), selected_user as (
  select "numericId" from existing_user
  union all
  select "numericId" from inserted_user
  limit 1
), project_id_candidate as (
  select greatest(
    coalesce((select max("numericId") from public.projects), 0),
    coalesce((select value from public.counters where name = 'projects'), 0),
    24000
  ) + 1 as id
), inserted_project as (
  insert into public.projects (
    "numericId",
    name,
    slug,
    description,
    category,
    status,
    stellar_account_id,
    stellar_contract_id,
    tags,
    website_url,
    github_url,
    github_repos,
    logo_url,
    research_images,
    stellar_network,
    user_id,
    featured,
    rejection_reason,
    created_at,
    updated_at
  )
  select
    project_id_candidate.id,
    'Bridgelet',
    'bridgelet',
    trim($description$
Bridgelet is an open-source Stellar infrastructure project that helps organizations send payments to recipients who do not have crypto wallets yet. The core workflow creates secure, single-use ephemeral Stellar accounts, lets a recipient claim funds without managing a seed phrase up front, and then sweeps the balance into a permanent wallet when the claim is redeemed.

Research summary: Bridgelet is a good fit for the Payments and Infrastructure categories because it targets payroll, aid distribution, airdrops, and other mass-payment use cases where wallet onboarding is the blocker rather than payment rail availability. Its main coordination repository documents a reference UI, product docs, and an MVP scope covering account creation, one inbound payment per account, destination-locked transfers, auto-sweep on claim, and recovery for expired unclaimed accounts.

How it uses Stellar: the project uses Stellar accounts as temporary payment receivers and uses Soroban smart contracts for restriction and sweep logic. The bridgelet-core repository contains Rust/Soroban contracts for EphemeralAccount, SweepController, and ReserveContract. These contracts are designed to enforce single-inbound-payment behavior, authorized sweep destinations, time-based expiration, multi-asset sweeps, base-reserve accounting, TTL management, and audit events such as AccountCreated, PaymentReceived, SweepExecutedMulti, and AccountExpired. The bridgelet-sdk repository provides a NestJS backend that integrates Stellar SDK, Horizon testnet, Soroban RPC, account lifecycle management, claim authentication, sweeps, webhooks, and admin APIs.

On-chain activity and deployment notes: available public docs show active Soroban implementation work and a testnet deployment path, but I did not find a published deployed contract ID or funded Stellar account that can be safely attached to the Hub profile. The correct network signal is therefore testnet/development, with stellar_account_id and stellar_contract_id left empty until maintainers publish verified addresses. The project itself warns that authorization and token-transfer layers are still in MVP development, that direct EphemeralAccount::sweep calls bypass contract-level signature verification unless routed through SweepController, and that SDK secret encryption is currently a development stub that must be replaced before production use.

Team and community: Bridgelet is maintained by bridgelet-org. Drips lists bridgelet-org as an approved Stellar Wave Program org with Fatima Aminu (phertyameen) as its listed member. Drips also lists three approved repositories: bridgelet, bridgelet-sdk, and bridgelet-core. GitHub activity indicators at research time show the coordination repo with 94 commits and 26 forks, bridgelet-sdk with 118 commits and 28 forks, and bridgelet-core with 88 commits, 20 forks, and open issues/PRs, suggesting active MVP buildout rather than a finished production product.

Why it matters: Bridgelet addresses a practical adoption gap for Stellar payments: senders can use Stellar rails before every recipient has learned wallet setup, custody, or seed phrase handling. If the project completes its encryption, webhook, authorization, and contract hardening work, it could become reusable onboarding infrastructure for fintechs, NGOs, payroll providers, and community projects that want Stellar settlement without forcing recipients through crypto onboarding before payment delivery.

Research sources: Drips Stellar Wave org page for bridgelet-org; GitHub repositories bridgelet-org/bridgelet, bridgelet-org/bridgelet-sdk, and bridgelet-org/bridgelet-core; public READMEs and repository metadata reviewed on 2026-06-01.
$description$),
    'Payments',
    'approved',
    null,
    null,
    'stellar,wave,payments,infrastructure,soroban,ephemeral-accounts,onboarding,sdk',
    'https://github.com/bridgelet-org/bridgelet',
    'https://github.com/bridgelet-org/bridgelet',
    '[{"label":"Coordination + reference UI","url":"https://github.com/bridgelet-org/bridgelet"},{"label":"Backend SDK","url":"https://github.com/bridgelet-org/bridgelet-sdk"},{"label":"Soroban contracts","url":"https://github.com/bridgelet-org/bridgelet-core"}]'::jsonb,
    null,
    '[]'::jsonb,
    'testnet',
    selected_user."numericId",
    0,
    null,
    '2026-06-01T00:00:00Z'::timestamptz,
    '2026-06-01T00:00:00Z'::timestamptz
  from project_id_candidate
  cross join selected_user
  where not exists (
    select 1 from public.projects where slug = 'bridgelet'
  )
  returning "numericId"
)
insert into public.counters (name, value)
values
  ('users', greatest(
    coalesce((select max("numericId") from public.users), 0),
    coalesce((select value from public.counters where name = 'users'), 0)
  )),
  ('projects', greatest(
    coalesce((select max("numericId") from public.projects), 0),
    coalesce((select value from public.counters where name = 'projects'), 0)
  ))
on conflict (name) do update
set value = greatest(public.counters.value, excluded.value);

commit;
