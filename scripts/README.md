DAMREV submission helper

Files:
- `damrev_project.json` — prepared JSON payload for the DAMREV project.
- `submit_damrev.sh` — helper script to POST the payload to the Hub API.

Usage:
1. Obtain a JWT by registering and logging in to the Hub (or use an existing account):

```bash
# example (not provided by this repo):
# curl -X POST https://usestellarwavehub.vercel.app/api/auth/login -d '{...}'
```

2. Submit the project with the script (pass JWT as arg or set `JWT` env var):

```bash
export JWT="<your_jwt_here>"
./scripts/submit_damrev.sh

# or
./scripts/submit_damrev.sh "<your_jwt_here>"
```

3. The script prints the response body and an `HTTP_CODE:` line.

Note: The script posts to `https://usestellarwavehub.vercel.app` by default. To target a local dev server, set `API_URL` environment variable:

```bash
API_URL="http://localhost:3000" JWT="<token>" ./scripts/submit_damrev.sh
```
