# Maintainer Guide

This guide is for repo maintainers — anyone holding the `admin` role on Stellar Wave Hub. It covers what the role is responsible for, what it can and can't do, and the checklist to run through before approving a project submission.

## Responsibilities

As a maintainer you're expected to:

- Triage the **Pending** queue (`/admin`) regularly so contributors aren't left waiting on a submission.
- Approve, feature, reject, or delist project submissions based on the [review checklist](#review-checklist) below.
- Provide a clear reason whenever you reject or delist a project — it's shown back to the submitter.
- Moderate ratings/reviews when needed (e.g. remove a review that violates the [Code of Conduct](../CONTRIBUTING.md#code-of-conduct)).
- Keep on-chain contract settings (fees, registry admin) up to date via the **Contract** tab, if you manage that infrastructure.

## Roles & Permissions

There are three roles in the system: `contributor` (default for new accounts), `maintainer` (elevated trust — can review submissions but not manage the system), and `admin` (full access). Roles are stored in `users.role` and are not self-assignable; see [Becoming a maintainer](#becoming-a-maintainer).

The `maintainer` role was added to allow trusted community members to review and manage submissions without granting full admin access. In code, `hasMinRole(user.role, "admin")` checks for `admin` only, while `hasMinRole(user.role, "maintainer")` grants access to both `maintainer` and `admin` (due to the numerical hierarchy: contributor=0, maintainer=1, admin=2).

| Action | Contributor | Maintainer | Admin |
|---|---|---|---|
| Submit a project | ✅ | ✅ | ✅ |
| Rate / review approved projects | ✅ | ✅ | ✅ |
| Edit their own project | ✅ | ✅ | ✅ |
| Edit *any* project | ❌ | ❌ | ✅ |
| Edit/delete their own rating | ✅ | ✅ | ✅ |
| Edit/delete *any* rating | ❌ | ❌ | ✅ |
| Approve / feature a submission | ❌ | ✅ | ✅ |
| Reject / delist a project | ❌ | ✅ | ✅ |
| Permanently delete a project | ❌ | ❌ | ✅ |
| View the pending approval queue (data) | ❌ | ✅ (read-only on `/queue`) | ✅ |
| Access `/admin` | ❌ | ❌ | ✅ |

**Code references:**
- `web/src/lib/roles.ts` — role hierarchy and `hasMinRole()`
- `web/src/app/api/projects/[id]/approve/route.ts` — `hasMinRole(auth.role, "admin")`
- `web/src/app/api/projects/[id]/reject/route.ts` — same gate
- `web/src/app/api/projects/[id]/delist/route.ts` — same gate
- `web/src/app/api/projects/[id]/delete/route.ts` — same gate
- `web/src/app/api/admin/projects/route.ts` — `hasMinRole("admin")`
- `web/src/app/api/projects/pending/route.ts` — `hasMinRole("admin")`
- `web/src/app/admin/page.tsx` — `hasMinRole(user.role, "admin")` UI gate

## Review checklist

Before approving (or featuring) a submission, confirm it meets the requirements already published in [CONTRIBUTING.md](../CONTRIBUTING.md):

- [ ] The project is genuinely part of the Stellar Wave Program.
- [ ] All claims are verifiable from public sources (GitHub, website, on-chain explorer).
- [ ] The description is original (no copy-paste) and meets the minimum length required at submission.
- [ ] The Stellar account ID and/or Soroban contract ID resolve on-chain on the stated network (testnet/mainnet).
- [ ] Category and tags accurately reflect what the project actually does.
- [ ] Any research images attached are relevant and support the submission (visible on the Pending card).
- [ ] GitHub and website links actually load and belong to the project.

If a submission fails one or more of these, **reject** or **delist** it with a short, specific reason — the submitter sees this and can resubmit.

## Using the dashboard

- **`/admin`** is the maintainer dashboard. It's tabbed: **Pending** (awaiting review — approve/feature/reject here), **Approved**, **Featured**, **Rejected/Delisted** (can be re-approved), **All Projects** (searchable), and **Contract** (on-chain registry settings).
- Approve and Feature are one-click actions; Reject and Delist open a dialog asking for a reason; Delete asks for confirmation and is permanent (removes the project and its ratings).
- **`/queue`** is the public-facing pending list — contributors and the community can see what's awaiting review, but it has no action buttons; only `/admin` can act on it.

## Becoming a maintainer

There's no in-app request flow yet. The `admin` role is granted by setting `users.role = 'admin'` directly in the database for the relevant `numericId`. If you need maintainer access, ask an existing maintainer to do this for you.
