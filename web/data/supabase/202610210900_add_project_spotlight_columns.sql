-- Migration: Add spotlight columns to projects
-- Related issue: #441

begin;

alter table public.projects
  add column if not exists featured_until timestamptz,
  add column if not exists featured_tx_hash text;

-- Preserve existing data and stop with a clear message if hashes already
-- violate the uniqueness rule. Resolve duplicates by confirming the canonical
-- project for each hash and correcting only after an explicit data review.
do $$
begin
  if exists (
    select featured_tx_hash
    from public.projects
    where featured_tx_hash is not null
    group by featured_tx_hash
    having count(*) > 1
  ) then
    raise exception 'Cannot enforce unique featured_tx_hash: duplicate non-null values exist in public.projects'
      using hint = 'Review duplicate hashes and determine the canonical project for each before rerunning this migration.';
  end if;
end;
$$;

create unique index if not exists projects_featured_tx_hash_unique_idx
  on public.projects (featured_tx_hash)
  where featured_tx_hash is not null;

commit;
