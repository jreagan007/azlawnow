# X Bootstrap Recipe

> The repeatable playbook for taking any Taqtics property's X account from zero to a working organic-growth engine. Tested and shipping on @azlawnow. Mirror this for AEE Law, MesoWatch, LexGro, McConathy Law, and any new client.

## Property checklist (one row per X account)

| Field | @azlawnow | AEE Law | MesoWatch | LexGro | McConathy |
|---|---|---|---|---|---|
| Handle | @azlawnow | TBD | TBD | TBD | TBD |
| user_id | 2042351967956013056 | TBD | TBD | TBD | TBD |
| Bio (newsroom-positioned, not firm-pitch) | NEEDS REWRITE | TBD | TBD | TBD | TBD |
| Profile photo (logo, NOT stock) | TBD | TBD | TBD | TBD | TBD |
| Banner (audit-style screenshot or city skyline) | TBD | TBD | TBD | TBD | TBD |
| `X_<PROP>_API_KEY` etc in ops/.env | yes | TBD | TBD | TBD | TBD |
| `verifyIdentity()` hardcoded EXPECTED_USERNAME / USER_ID in post script | yes | TBD | TBD | TBD | TBD |

## The 6 plays (run them in order; each builds on the one before)

### Play 1: Verify identity (one-time setup)

Each property needs an isolated set of X creds in `~/Projects/taqtics-ops/config/.env`:
```
X_<PROP>_API_KEY=...
X_<PROP>_API_SECRET=...
X_<PROP>_ACCESS_TOKEN=...
X_<PROP>_ACCESS_TOKEN_SECRET=...
```

Per the per-client-credential-naming feedback rule, never share creds between properties.

In the post script (`scripts/post-x-<prop>.ts`) hardcode:
```ts
const EXPECTED_USERNAME = 'azlawnow';        // change per property
const EXPECTED_USER_ID = '2042351967956013056';  // change per property
```

Every fire calls `/users/me` first and hard-fails on mismatch. Stops cross-account posting accidents.

### Play 2: Curated seed list (~250 accounts)

Build `scripts/outreach/x-seed-curated.py` per property. Hand-pick the universe organized by category:

**The standard categories** (mirror what's in azlawnow's seed file):
1. Local news orgs (city + statewide + alt-weekly + public radio + investigative nonprofits)
2. Named local reporters with public bylines (verify display_name matches expected entity, per parody-account QC rule)
3. State + federal elected officials covering the property's geography
4. State + federal regulators (AG, AGs across states, agencies)
5. City + county government accounts
6. Advocacy + policy organizations in the property's beats
7. National press with the property's beat coverage
8. National investigative orgs (ProPublica, KFF Health, Marshall Project, Reveal)
9. Specialty media for the property's beats
10. Influential commentators / columnists in those beats

For each handle, run `scripts/outreach/x-seed-curated.py` which:
1. Calls `/2/users/by/username/<handle>` for verification
2. Compares resolved `display_name` against the seed note (catches parody accounts)
3. Promotes verified entries to `status: candidate` in `data/outreach/x/x-follow-status.json`

Hit rate target: 40 to 50% verified (handles you guess wrong are the cost; the wins compound).

### Play 3: Execute follows (paced, with safety rails)

`scripts/outreach/x-follow-execute.py --live --limit 25` per cycle.

Hard rails baked into the script:
- `/users/me` identity check before any follow
- HARD daily cap at 50 (Free tier X spam threshold)
- Default cap at 25 (well below threshold, sustainable)
- 35s delay between follows = ~14 min per batch
- Per-action status update so reruns skip done

Schedule via launchd: weekday 10am PT. 5 days × 25 = 125 follows / week.

### Play 4: Strategic mention tweets (broadcast)

`scripts/x-mentions.json` (this property) holds N mention tweet templates per published investigation. Each tweet:
- Tags ONE high-value account in the FIRST line so they get a clean notification
- Leads with a specific data point or named entity
- Has a 2-tweet thread: main mention + reply with the link
- Voice rules: contractions, no em-dashes, no banned words, fragments OK

Fire via `bash scripts/fire-mentions.sh` (4-min spacing between mentions for organic feel).

### Play 5: Engagement tweets (peer-conversation)

`scripts/x-engagement.json` holds N engagement tweets per investigation. Different from mentions:
- Tag 1-3 accounts naturally inside the sentence (not stacked at start)
- End with offer ("we have the records, reach out") OR question ("which AZ cities have picked them up?")
- Reads like a peer journalist sliding into the conversation, not a broadcast

Fire via `bash scripts/fire-engagement-tonight.sh` (5-min spacing, 5 max per session to stay organic).

### Play 6: Discovery harvest (continuous expansion)

Two harvest cycles run on launchd:

A. **`x-search-harvest.py`** (weekday 2pm PT) hits `/2/tweets/search/recent` with property-specific keyword queries. Pulls authors + mentions from results. Verifies each via `/by/username` before adding to `status: review_required` (manual triage gate prevents follow-bombing the noise).

B. **Weekly review pass** (manual, Friday): Jared promotes review_required entries to candidate, marks bad matches as skip_wrong_match.

## The launchd stack (per property)

Three plists per property in `~/Library/LaunchAgents/`:
1. `com.<prop>.x-follow-execute.plist`, weekday 10am PT, --live --limit 25
2. `com.<prop>.x-search-harvest.plist`, weekday 2pm PT, discovers candidates
3. `com.<prop>.outreach-cycle.plist`, 7x/day mail drain (8/10/12/14/16/18/20 PT)

All staged in `~/Library/LaunchAgents/PAUSED-staged/` until Jared restores. Restore commands documented in the property's `AUTOMATION.md`.

## The bio rule

Bio reads as a NEWSROOM, not a firm pitch. Journalists scanning your profile in 3 seconds need to think "peer worth following" not "law firm spam".

**Bad pattern** (what @azlawnow currently has, NEEDS REWRITE):
> "You Get Answers. West Valley investigative injury firm. Crash data. Nursing home citations. Three editors. Two offices. (602) 654-0202"

**Good pattern**:
> "AZ Law Now: Brendan Franks investigations. Charter accountability, ICE detention, heat deaths, pharmacy enforcement. Primary-source AZ reporting. azlawnow.com"

Same data underneath, different positioning. The phone number kills journalist follow-back rate.

## The "important accounts" rule (top-tier seed expansion)

Beyond the 250-account local universe, every property should also follow these top-tier amplifier accounts:

**National investigative + accountability**
- @ProPublica, @TheMarshallProj, @Reveal, @ICIJorg
- @KFFHealthNews, @InsideClimate
- @MotherJones, @TheNation, @theintercept

**National political journalists who cover state-level accountability**
- Beat reporters at @nytimes, @washingtonpost, @AP, @Reuters, @guardian
- @POLITICO state reporters
- @AxiosLocal accounts

**Federal regulators relevant to property beats**
- @USDOJ, @EPA (regional offices), @FBI field offices
- @CDCgov, @CMSGov, @HHSGov for health-vertical
- @DEAHQ + regional divisions for pharmacy
- @USDOL, @ACLU national + state chapters

**National advocacy with state implications**
- @NAACP, @SPLC, @ACLU
- @CommonCause, @LWV (League of Women Voters)
- Beat-specific: @ShatterproofHQ, @AARP, @childrensdefense

**Influential individual voices**
- High-follower accountability journalists (Yamiche Alcindor, Kara Swisher when on-beat)
- State AGs across states (Mayes, Bonta, James, etc) for cross-pollination
- Federal elected officials whose beats overlap

**Cross-property accounts**
- Sister Taqtics properties: @aeelaw, @mesowatch, etc. should follow each other for the network effect

These aren't going to follow back, but they're SOURCES (you see what they post, you can reply / quote-tweet) and they're SIGNALS (the algorithm learns what kind of account you are based on what you follow).

## Daily metrics target (sustained)

| Metric | Target | Live for @azlawnow |
|---|---|---|
| Followers added per week | +5 to +15 | TBD (check after launchd live for 1 week) |
| Tweets posted per week | 15 to 25 | 17 in first session |
| Mentions of your @ from other accounts | 3+ per week | 0 (positioning issue, see bio rule) |
| Replies to your tweets from real accounts | 1+ per week | 0 (need engagement loop running) |
| Total following | 100 to 500 | 51 |

## What @azlawnow needs RIGHT NOW (action items)

1. **Bio rewrite** to newsroom positioning (see bio rule above)
2. **Profile photo** confirmed (likely fine, haven't checked)
3. **Restore launchd plists** so the recipe runs on schedule
4. **Triage 60 X review_required candidates** from x-search-harvest
5. **Add top-tier expansion accounts** (this commit adds ~50 more)
6. **Fire 5 engagement tweets** (in flight via fire-engagement-tonight.sh)

## What to mirror to AEE Law / MesoWatch / LexGro / McConathy

For each property:
1. Get the X handle's user_id via `/users/by/username`
2. Hardcode `EXPECTED_USERNAME` + `EXPECTED_USER_ID` in `scripts/post-x-<prop>.ts`
3. Add `X_<PROP>_API_*` keys to ops/.env
4. Fork `scripts/outreach/x-seed-curated.py` to `scripts/outreach/x-seed-<prop>.py` and rewrite SEED for that property's beats
5. Fork the 3 launchd plists with new Label / paths
6. Build the property's `data/outreach/x/x-follow-status.json` from the seed
7. Run dry-run, then live, then schedule
