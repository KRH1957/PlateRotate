# PlateRotate — Deployment Guide
# platerotate.com · Landing Page + APK Hosting

**Written for:** Kevin (non-technical steps, plain English)
**Goal:** Get platerotate.com live with the landing page and a working APK download link tonight.
**Time required:** ~30–45 minutes total.

---

## Overview: Two-Part Job

You need two things working at the same time:

1. **The landing page** — `landing-page.html` served at `https://platerotate.com`
2. **The APK file** — a direct download URL that the landing page's "Download Free" button will point to

These are best handled by two different services. The guide below covers the recommended approach (fastest, free) and the Porkbun-native approach if you want everything under one roof.

---

## Recommended Approach (Free, ~30 Minutes)

### Part 1 — Host the Landing Page on Netlify (Free)

Netlify is a free website host. No account setup required for the first deploy — just drag and drop. 100GB of free bandwidth per month.

**Step 1: Get the landing page file**
The file is at: `~/app-business/apps/plate-rotate/marketing/landing-page.html`
Copy it to your Windows desktop or Downloads folder so it's easy to find.

**Step 2: Deploy to Netlify**
1. Open your browser and go to **netlify.com/drop**
2. Drag `landing-page.html` from your computer onto the drop zone on that page
3. Netlify will give you a live URL instantly — something like `https://random-name-12345.netlify.app`
4. Your site is live. Test it by clicking the URL.

**Step 3: Connect your platerotate.com domain**
1. Create a free Netlify account (use your email) so you can manage the domain connection
2. In Netlify: go to your site → **Domain settings** → **Add custom domain** → type `platerotate.com`
3. Netlify will give you a CNAME value. It will look like: `[something].netlify.app`

**Step 4: Update DNS at Porkbun**
1. Log into porkbun.com → go to **Domain Management** → find `platerotate.com`
2. Click the DNS records icon (pencil/edit icon next to your domain)
3. Delete any existing **A** or **ALIAS** records pointing to the default Porkbun parking page
4. Add a new **CNAME** record:
   - **Type:** CNAME
   - **Host:** `www`
   - **Answer:** the Netlify address from Step 3 (e.g., `your-site.netlify.app`)
5. Add another record for the root domain (no www):
   - **Type:** A
   - **Host:** *(leave blank)*
   - **Answer:** Netlify's load balancer IP — `75.2.60.5` (this is Netlify's standard IP for apex domains)
6. Click Save. Changes usually take 5–30 minutes.

**Step 5: Verify**
Wait a few minutes, then open `https://platerotate.com` in your browser. You should see the landing page.

---

### Part 2 — Host the APK on GitHub Releases (Free, Permanent)

GitHub Releases is the standard way indie developers distribute APK files. It's free, has no bandwidth limits for public repos, and gives you a permanent direct download URL.

**Why not host the APK on Netlify or Porkbun?**
- Porkbun static hosting has a **40MB per-file upload limit** — your APK may be close to or over this
- Netlify's free tier works for APK files but isn't the cleanest solution for binary distribution
- GitHub Releases is purpose-built for distributing app binaries and is the industry standard for indie apps

**Step 1: Create a free GitHub account**
Go to **github.com** and sign up with your email (krhdigital@gmail.com or any email). It's free.

**Step 2: Create a repository for PlateRotate**
1. Click the **+** icon → **New repository**
2. Name it: `plate-rotate`
3. Set it to **Public** (required for free bandwidth)
4. Click **Create repository**

**Step 3: Upload the APK as a Release**
1. In your new repository, click **Releases** (right side of the page) → **Create a new release**
2. In **Tag version**, type: `v1.0.0`
3. In **Release title**, type: `PlateRotate v1.0.0`
4. In the **Attach binaries** section at the bottom, drag your APK file in
5. Click **Publish release**

**Step 4: Get your direct download URL**
After publishing, your APK download URL will be:
```
https://github.com/YOUR-USERNAME/plate-rotate/releases/download/v1.0.0/PlateRotate-v1.0.0.apk
```
Replace `YOUR-USERNAME` with your GitHub username and use the exact filename of your APK.

**Step 5: Wire up the landing page**
Once you have the GitHub download URL, tell Mason — he'll update the landing page email modal so that after the user submits their email, the APK download triggers automatically from that URL.

---

## Alternative: Porkbun Static Hosting (Everything in One Place)

If you want to keep everything at Porkbun and avoid creating a Netlify account:

### Setup Porkbun Static Hosting

**Step 1: Activate hosting**
1. Log into porkbun.com → **Domain Management**
2. Find `platerotate.com` and click the **house icon** under the "Website" column
3. Click **Select A Plan** under the Static Hosting section
4. Choose the **Starter** plan — $2.50/month (there's a 15-day free trial)
5. Complete billing setup

**Step 2: Get your FTP credentials**
1. After activation, go back to Domain Management → click the house icon for `platerotate.com`
2. Scroll down to the **FTP Credentials** section
3. Note down: Hostname, Username, Password

**Step 3: Install FileZilla (free FTP program)**
Download from **filezilla-project.org** → install on your Windows PC

**Step 4: Connect and upload**
1. Open FileZilla
2. At the top, enter your FTP credentials:
   - **Host:** the Hostname from Porkbun
   - **Username:** from Porkbun
   - **Password:** from Porkbun
   - **Port:** `21`
3. Click **Quickconnect**
4. Left panel = your computer, Right panel = Porkbun server
5. Find `landing-page.html` on the left, drag it to the right panel (into the `public_html` folder)
6. Your site is live at `platerotate.com` once DNS updates

**Step 5: DNS (if not already pointing to Porkbun hosting)**
Porkbun usually auto-configures DNS when you activate their hosting. If the site isn't loading after 30 minutes:
1. Go to Domain Management → DNS records for `platerotate.com`
2. Confirm there's an **A record** with Host blank (root) pointing to your Porkbun hosting IP
3. Confirm there's an **A record** with Host `www` pointing to the same IP
4. The IP will be shown in your Porkbun hosting dashboard

**APK hosting with Porkbun:** Porkbun has a 40MB per-file limit on static hosting. If your APK is under 40MB, you can upload it the same way as the HTML file. If it's over 40MB, use GitHub Releases for the APK (Part 2 above) and Porkbun for the landing page.

---

## After Launch: Updating the APK

When you release a new version of PlateRotate:

**GitHub Releases:** Create a new release (e.g., `v1.0.1`) and attach the new APK. Update the download URL in the landing page to point to the new version.

**Porkbun FTP:** Connect with FileZilla and overwrite the APK file with the new one. The URL stays the same.

---

## Pre-Launch Checklist

Before you tell anyone the site is live:

- [ ] `https://platerotate.com` loads the landing page
- [ ] "Download Free" button opens the email capture modal
- [ ] Email modal submits successfully (check browser console for the captured email log)
- [ ] APK download URL works — paste it directly into a browser, it should trigger a file download
- [ ] Test on mobile — the page should look good on a phone screen
- [ ] SSL certificate active — URL should show `https://` not `http://` (Netlify and Porkbun both auto-provision SSL)

---

## Quick Reference: What Goes Where

| Item | Host | Cost | URL Format |
|---|---|---|---|
| Landing page HTML | Netlify (recommended) or Porkbun | Free / $2.50mo | `https://platerotate.com` |
| APK file | GitHub Releases | Free | `github.com/USER/REPO/releases/download/v1.0.0/file.apk` |
| Email capture backend | Not yet built — modal logs to console for now | — | Mason to wire up before launch |

---

## Need Help?

- Porkbun support: support@porkbun.com
- Netlify docs: docs.netlify.com
- GitHub Releases docs: docs.github.com/en/repositories/releasing-projects-on-github

**Or just ask Mason** — paste the error and he'll walk you through it.
