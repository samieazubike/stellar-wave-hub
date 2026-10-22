# Admin user roles

Apply `data/supabase/202610210000_admin_user_roles.sql` in Supabase before deploying this feature. The role endpoint intentionally requires its database function: missing migrations fail closed rather than using an unprotected fallback.

`GET /api/admin/users?search=&role=&page=` returns 25 users per page, ordered by ID, with only ID, username, email, role and creation date. The dashboard provides search, role filters, pagination, role selection, saving/error feedback and retry. Non-admin users do not mount the Users section.

`PUT /api/admin/users/[id]/role` accepts only `{ "role": "contributor" | "maintainer" | "admin" }`. Both routes require an admin token and a current admin row. The service-role-only SQL function repeats authorization inside a serialized transaction, rejects self-demotion and last-admin demotion, and returns only public management fields. Table locking serializes concurrent role writes. Client-supplied actor IDs are never used.

Run `node --test tests/admin-users.test.mjs` for actual route-handler authorization/input/pagination tests. The database migration was separately executed under PostgreSQL using PGlite: promotion and reversal, demotion, stale-admin denial, self-demotion, missing users, invalid role and function grants all passed. Production database migration is a deployment prerequisite; no live user roles were changed.
