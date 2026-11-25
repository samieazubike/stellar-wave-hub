create table if not exists bookmarks (
  user_id bigint not null references users(numeric_id) on delete cascade,
  project_id bigint not null references projects("numericId") on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

create index if not exists bookmarks_user_id_created_at_idx
  on bookmarks (user_id, created_at desc);
