# Public projects API v1

Create a key with your signed-in session token in `Authorization: Bearer <session token>`
using `POST /api/keys` and a JSON body such as `{"name":"My website"}`.
Send the returned `key` to the project API in `X-API-Key` or as a
`Bearer` token. The plaintext key is returned once. `GET /api/keys` lists
key metadata; `DELETE /api/keys?id=<id>` revokes a key.

Both project endpoints require a valid, unrevoked key. A missing or invalid
key returns `401`. Browser clients may call the endpoints from any origin;
the API accepts `X-API-Key` and `Authorization` on CORS preflight requests.

## List projects

`GET /api/v1/projects?category=defi&search=wallet&sort=newest&page=1&limit=20`

- `category` matches one category, ignoring case.
- `search` matches project name, description, or tags, ignoring case.
- `sort`: `newest` (default), `top-rated`, or `most-reviewed`.
- `page` is a positive integer (default 1); `limit` is 1–100 (default 20).
- Only approved or featured projects appear.

Response:

```json
{
  "projects": [{
    "id": 42,
    "slug": "example-project",
    "name": "Example Project",
    "description": "A project description",
    "category": "defi",
    "tags": ["payments", "wallet"],
    "website_url": "https://example.com",
    "github_url": null,
    "logo_url": null,
    "stellar_account_id": null,
    "stellar_contract_id": null,
    "stellar_network": "mainnet",
    "featured": false,
    "created_at": "2026-11-25T00:00:00Z",
    "rating": { "average": 4.5, "count": 2 }
  }],
  "pagination": { "page": 1, "limit": 20, "total": 1, "pages": 1 }
}
```

`rating.average` is `null` when the project has no ratings.

## Single project

`GET /api/v1/projects/example-project?include=financials`

The response is `{ "project": <the same project shape> }`. With
`include=financials`, it also has `financials`, containing the latest stored
snapshot as `{ "captured_at": "...", "summary": { ... } }`, or `null` if no
snapshot exists. Unknown or unapproved slugs return `404`.
