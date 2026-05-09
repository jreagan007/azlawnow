# Permanent Meta token setup (FB + IG posting from AZ Law Now)

> **Goal:** stop refreshing short-lived user tokens every 24 hours. This doc walks the one-time setup that produces a never-expiring page token for FB + IG posting.
> **Owner:** Jared Reagan (the steps require Meta Business Suite admin access).
> **One-time effort:** ~10 minutes in Meta Business Suite + 1 minute to drop the token at the agent.
> **Outcome:** all future posts to @azlawnow on FB + IG just work, no token refresh ever.

---

## Background

The Meta Graph API short-lived user tokens we've been using expire in roughly 1 to 8 hours. Page tokens derived from them inherit that same expiry. The result: every 24-48 hours, FB + IG posting fails with `Error validating access token: Session has expired`, and a fresh token has to be pasted in.

There are two ways out, in order of preference.

---

## Option A (preferred): System User token (never expires)

A System User in Meta Business Suite is a non-human identity that owns API access. Tokens generated for a System User can be set to **expiry: Never**, with admin/post permissions on the AZ Law Now Page.

**Steps in Meta Business Suite (Jared, ~10 minutes):**

1. Open https://business.facebook.com/settings/system-users
2. Click **Add** to create a new System User.
   - Name: `azlawnow-posting-bot` (or similar)
   - System User Role: **Employee** (sufficient for posting; only escalate to Admin if API requires it later)
3. With the new System User selected, click **Add Assets** in the right pane.
   - Asset type: **Pages**
   - Pick: **AZ Law Now**
   - Permissions: **Manage Page** (this is the umbrella permission that covers `pages_manage_posts`, `pages_show_list`, `pages_read_engagement`, plus IG content publish through the linked IG business account)
4. Still on the System User row, click **Generate New Token**.
   - App: pick the AZ Law Now app (app id `2332140233902910` from our prior token debug)
   - Token expiration: **Never**
   - Permissions to check:
     - `pages_show_list`
     - `pages_read_engagement`
     - `pages_manage_posts`
     - `instagram_basic`
     - `instagram_content_publish`
     - `instagram_manage_comments`
     - (skip everything else, principle of least privilege)
5. Copy the generated token. Drop it into Claude with the same `EAA...` paste pattern as before. The agent runs `python3 scripts/exchange-az-page-token.py` (the saved version), which:
   - Verifies the token is for the AZ Law Now Page (id 395622053639601)
   - Finds the linked IG business account (id 17841447928878292)
   - Writes `AZLAW_FB_PAGE_TOKEN`, `AZLAW_FB_PAGE_ID`, `AZLAW_IG_TOKEN`, `AZLAW_IG_USER_ID`, `AZLAW_IG_BUSINESS_ID` to `~/Projects/taqtics-ops/config/.env`
   - Tempfile cleanup at the end (token never lingers on disk)

After step 5, FB + IG posting just works indefinitely.

---

## Option B (fallback): App credentials + 60-day exchange

If the System User route is blocked for any reason, the second-best approach is to add the FB App credentials to ops/.env so the agent can do the long-lived OAuth exchange itself.

**Steps:**

1. Open https://developers.facebook.com/apps/2332140233902910/settings/basic/
2. Copy the **App ID** (already known: 2332140233902910) and the **App Secret** (the eye icon reveals it).
3. Drop both at Claude with: "Here's the FB App ID + Secret: APP_ID=... APP_SECRET=..."
4. Agent appends to ops/.env as `FB_APP_ID` and `FB_APP_SECRET`.

After that, every time a fresh short-lived user token comes in, the agent runs the OAuth long-lived exchange:

```
GET /v18.0/oauth/access_token?
  grant_type=fb_exchange_token
  &client_id={FB_APP_ID}
  &client_secret={FB_APP_SECRET}
  &fb_exchange_token={SHORT_USER_TOKEN}
```

This produces a **60-day user token**, which then derives a **60-day page token** (or, with proper scopes, a never-expiring one). Still a periodic refresh, but every 60 days instead of every 24 hours.

Option A is strictly better. Option B is here as a fallback if the System User UI changes or the asset assignment fails.

---

## Saved utility scripts

Both scripts live at `/tmp/` after first run because they handle a secret. They self-clean their tempfile after success.

**Quick exchange (Option A, never-expiring System User token):**
- Script: `/tmp/exchange-az-page-token.py`
- Inputs: token at `/tmp/az-fb-token-<date>.txt`, page id `395622053639601`
- Outputs: writes 5 keys to `~/Projects/taqtics-ops/config/.env`, removes the tempfile

**Long-lived exchange (Option B, app credentials route):**
- Script: `/tmp/long-lived-az-token.py`
- Reads `FB_APP_ID` + `FB_APP_SECRET` from ops/.env, does the OAuth exchange, then derives the page token

To make either script repeatable across machines and survive `/tmp` cleanup, copy the canonical version to the ops repo:
- `~/Projects/taqtics-ops/scripts/exchange-az-page-token.py`
- `~/Projects/taqtics-ops/scripts/long-lived-az-token.py`

---

## How to verify the token is live

After any token refresh:

```bash
# Identity probe (no secret echo, just confirms token works for AZ Law Now)
source ~/Projects/taqtics-ops/config/.env
curl -s "https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${AZLAW_FB_PAGE_TOKEN}" | python3 -m json.tool
```

Should return:
```json
{
  "id": "395622053639601",
  "name": "AZ Law Now"
}
```

If the response has an `error` key, the token is invalid or expired.

---

## What's in ops/.env after setup

```
AZLAW_FB_PAGE_TOKEN=...           # the never-expiring page token (Option A) or 60-day (Option B)
AZLAW_FB_PAGE_ID=395622053639601
AZLAW_IG_TOKEN=...                # same as page token
AZLAW_IG_USER_ID=17841447928878292
AZLAW_IG_BUSINESS_ID=17841447928878292
# Option B only:
FB_APP_ID=2332140233902910
FB_APP_SECRET=...
```

These values are read by:
- `scripts/post-fb-azlaw.ts` (FB feed posts)
- `scripts/post-ig-azlaw.ts` (IG photo + first comment)
- `scripts/fire-morning-push-2026-05-06.sh` (token sanity probe at the start of each daily fire)

---

## Recovery paths if a token DOES expire

Order of operations for the agent if FB + IG posts fail with token errors:

1. Check `AZLAW_FB_PAGE_TOKEN` validity with the identity probe above.
2. If expired and Option A System User token was set: regenerate in Business Suite, paste fresh token at agent.
3. If expired and Option B credentials are set: ask Jared for a fresh short-lived token, agent exchanges to 60-day automatically.
4. As a last resort, fall back to text-only X posts (which use OAuth 1.0a creds that don't expire) and queue FB + IG drops for later.

---

*Last updated 2026-05-08. Lives in azlawnow repo for visibility; the actual scripts and tokens live under taqtics-ops.*
