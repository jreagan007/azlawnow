/**
 * post-x-azlaw.ts
 * Post to AZ Law Now X / Twitter via API v2 with self-reply for the article link.
 * Uses X_AZLAW_* OAuth 1.0a creds from taqtics-ops/config/.env.
 *
 * Usage:
 *   npx tsx scripts/post-x-azlaw.ts --id azln-01
 *   npx tsx scripts/post-x-azlaw.ts --id azln-01 --dry-run
 *   npx tsx scripts/post-x-azlaw.ts --next       # next unposted from x-drops.json
 *   npx tsx scripts/post-x-azlaw.ts --list
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DROPS = path.join(ROOT, 'scripts/x-drops.json');
const POSTED_LOG = path.join(ROOT, 'data/outreach/x-posted.json');

function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const eq = t.indexOf('=');
    const k = t.slice(0, eq);
    if (!process.env[k]) process.env[k] = t.slice(eq + 1).replace(/^"|"$/g, '');
  }
}
loadEnv('/Users/taqticlaw/Projects/taqtics-ops/config/.env');
loadEnv(path.join(ROOT, '.env'));

const CK = process.env.X_AZLAW_API_KEY!;
const CS = process.env.X_AZLAW_API_SECRET!;
const AT = process.env.X_AZLAW_ACCESS_TOKEN!;
const TS = process.env.X_AZLAW_ACCESS_TOKEN_SECRET!;
if (!CK || !CS || !AT || !TS) {
  console.error('Missing X_AZLAW_* credentials in env');
  process.exit(1);
}

function pe(s: string) {
  return encodeURIComponent(s).replace(/!/g, '%21').replace(/\*/g, '%2A').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
}

function buildOAuthHeader(method: string, url: string): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: CK,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: AT,
    oauth_version: '1.0',
  };
  const baseParams = Object.keys(oauthParams).sort().map((k) => `${pe(k)}=${pe(oauthParams[k])}`).join('&');
  const sigBase = `${method.toUpperCase()}&${pe(url)}&${pe(baseParams)}`;
  const signKey = `${pe(CS)}&${pe(TS)}`;
  const signature = crypto.createHmac('sha1', signKey).update(sigBase).digest('base64');
  oauthParams.oauth_signature = signature;
  return 'OAuth ' + Object.keys(oauthParams).sort().map((k) => `${pe(k)}="${pe(oauthParams[k])}"`).join(', ');
}

const EXPECTED_USERNAME = 'azlawnow';
const EXPECTED_USER_ID = '2042351967956013056';

async function verifyIdentity(): Promise<void> {
  const url = 'https://api.x.com/2/users/me';
  const r = await fetch(url, { headers: { Authorization: buildOAuthHeader('GET', url) } });
  const data = await r.json() as any;
  if (!r.ok) throw new Error(`X /users/me ${r.status}: ${JSON.stringify(data)}`);
  const u = data.data || {};
  if (u.username?.toLowerCase() !== EXPECTED_USERNAME || u.id !== EXPECTED_USER_ID) {
    throw new Error(`Identity mismatch: got @${u.username} (id ${u.id}), expected @${EXPECTED_USERNAME} (id ${EXPECTED_USER_ID})`);
  }
  console.log(`✓ Identity verified: @${u.username} (id ${u.id})`);
}

async function postTweet(text: string, replyToId?: string): Promise<string> {
  const url = 'https://api.x.com/2/tweets';
  const body: any = { text };
  if (replyToId) body.reply = { in_reply_to_tweet_id: replyToId };
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: buildOAuthHeader('POST', url), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json() as any;
  if (!r.ok) throw new Error(`X ${r.status}: ${JSON.stringify(data)}`);
  return data.data.id;
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const drops = JSON.parse(fs.readFileSync(DROPS, 'utf-8'));
const posted: any = fs.existsSync(POSTED_LOG) ? JSON.parse(fs.readFileSync(POSTED_LOG, 'utf-8')) : { posts: [] };
const postedIds = new Set(posted.posts.map((p: any) => p.id));

if (args.includes('--list')) {
  for (const p of drops.posts) {
    const status = postedIds.has(p.id) ? '✓' : ' ';
    console.log(`  [${status}] ${p.id}  ${p.topic.padEnd(28)}  ${p.text.split('\n')[0].slice(0, 60)}`);
  }
  process.exit(0);
}

let target;
if (args.includes('--id')) {
  const id = args[args.indexOf('--id') + 1];
  target = drops.posts.find((p: any) => p.id === id);
} else if (args.includes('--next')) {
  target = drops.posts.find((p: any) => !postedIds.has(p.id));
}
if (!target) { console.error('No target. Use --id <id>, --next, or --list.'); process.exit(1); }

console.log(`=== ${target.id} | ${target.topic} ===`);
console.log(`Main (${target.text.length} chars):\n${target.text}\n`);
console.log(`Reply (${target.reply.length} chars):\n${target.reply}\n`);

if (dryRun) { console.log('DRY RUN — not posting.'); process.exit(0); }
if (postedIds.has(target.id)) { console.error(`Already posted: ${target.id}`); process.exit(1); }

try {
  await verifyIdentity();
  const tweetId = await postTweet(target.text);
  console.log(`✓ Main tweet posted: https://x.com/i/status/${tweetId}`);
  await new Promise((r) => setTimeout(r, 1500));
  const replyId = await postTweet(target.reply, tweetId);
  console.log(`✓ Reply posted: https://x.com/i/status/${replyId}`);
  let mentionsId: string | undefined;
  if (target.mentions) {
    await new Promise((r) => setTimeout(r, 1500));
    mentionsId = await postTweet(target.mentions, replyId);
    console.log(`✓ Mentions posted: https://x.com/i/status/${mentionsId}`);
  }
  posted.posts.push({ id: target.id, tweet_id: tweetId, reply_id: replyId, mentions_id: mentionsId, posted_at: new Date().toISOString() });
  fs.mkdirSync(path.dirname(POSTED_LOG), { recursive: true });
  fs.writeFileSync(POSTED_LOG, JSON.stringify(posted, null, 2));
} catch (err: any) {
  console.error(`FAIL: ${err.message}`);
  process.exit(1);
}
