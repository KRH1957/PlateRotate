# PlateRotate Proxy — xCloud Deployment Guide

This server protects your Anthropic API key by keeping it off user devices.
Follow these steps to deploy it to xCloud before PlateRotate goes public.

---

## Before You Start — CRITICAL SECURITY STEP

The old API key (`sk-ant-api03-eId...`) was baked into the public APK on GitHub.
It is compromised. You MUST revoke it and get a new one before deploying.

1. Go to https://console.anthropic.com
2. Click **API Keys** in the left sidebar
3. Find the old key and click **Revoke**
4. Click **Create Key**, name it `plate-rotate-proxy`, copy it immediately
5. Store it in your password manager — you only see it once

---

## Step 1 — Upload the proxy to xCloud

The proxy folder is at: `apps/plate-rotate/proxy/`

You need to get these files onto your xCloud server:
```
proxy/
  src/server.ts
  dist/server.js        ← compiled output, this is what actually runs
  package.json
  tsconfig.json
  .env.example
  .gitignore
```

**How to upload depends on how xCloud accepts files.** Common options:
- **SSH/SFTP:** Use FileZilla or your terminal to upload the folder
- **Git deploy:** Push the proxy folder to a GitHub repo, connect it to xCloud
- **Web file manager:** Use the xCloud dashboard to upload a zip of the folder

If you're not sure which method xCloud uses, log into your xCloud dashboard and
look for "Deploy", "Upload", or "New App" — then contact Mason with the method.

---

## Step 2 — Set environment variables on xCloud

In your xCloud dashboard, find the environment variables section (sometimes called
"Config Vars", "Environment", or "App Settings"). Add these three variables:

| Variable name       | Value                                              |
|---------------------|----------------------------------------------------|
| `ANTHROPIC_API_KEY` | Your NEW key from Step 0 (starts with `sk-ant-`)   |
| `APP_TOKEN`         | `feb87ffc9dc5b1eb20be1baed86680a57a9bfc581e018c05a7fe63e002303a98` |
| `PORT`              | `3000` (or leave blank — xCloud may set this itself) |

**These variables are never in the code.** They live only in xCloud's settings panel.

---

## Step 3 — Start the server

Tell xCloud to run this command to start the app:

```
node dist/server.js
```

Or if xCloud uses a Procfile, create a file called `Procfile` (no extension) with:
```
web: node dist/server.js
```

---

## Step 4 — Verify it's running

Once deployed, xCloud will give you a URL like `https://your-app.xcloud.com`.

Test it by opening this URL in your browser:
```
https://your-app.xcloud.com/health
```

You should see:
```json
{ "status": "ok", "service": "plate-rotate-proxy" }
```

If you see that — the server is live.

---

## Step 5 — Update the app with the live URL

Open `apps/plate-rotate/.env` and change:
```
EXPO_PUBLIC_PROXY_URL=http://localhost:3000
```
to:
```
EXPO_PUBLIC_PROXY_URL=https://your-app.xcloud.com
```

Then rebuild and re-upload the APK via EAS:
```
cd /home/krhco/app-business/apps/plate-rotate
eas build --platform android --profile preview --non-interactive
```

---

## What the server does (plain English)

- Listens for meal conversion requests from the PlateRotate app
- Checks that each request includes the correct app token (blocks random internet traffic)
- Calls Anthropic's Claude Haiku API using the key stored in xCloud's environment
- Returns the converted meal result to the app
- Limits each IP address to 30 requests per minute to prevent abuse
- Has a `/health` endpoint so you can always check if it's running
