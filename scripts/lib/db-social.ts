/**
 * db-social.ts
 * Tiny helper: write a social_posts row to azlawnow-outreach.db
 * using the sqlite3 CLI (no npm deps needed).
 *
 * Called by post-x-azlaw.ts, post-fb-azlaw.ts, post-ig-azlaw.ts
 * right after a successful post. Keeps the DB in sync without polling.
 */

import { execSync } from 'child_process';
import * as path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const DB = path.join(ROOT, 'data', 'outreach', 'azlawnow-outreach.db');

function slugify(topic: string): string {
  return topic.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function esc(s: string | undefined | null): string {
  // SQLite single-quote escaping
  return String(s ?? '').replace(/'/g, "''");
}

export interface SocialPostRecord {
  platform: 'x' | 'fb' | 'ig';
  drop_id: string;
  topic: string;
  post_id?: string;
  post_url?: string;
  posted_at: string;
  raw_payload: Record<string, unknown>;
}

export function writeSocialPost(rec: SocialPostRecord): void {
  const story_slug = slugify(rec.topic);
  const raw = JSON.stringify(rec.raw_payload);

  const sql = `
    INSERT INTO social_posts
      (platform, drop_id, topic, story_slug, post_id, post_url, posted_at, raw_payload)
    VALUES (
      '${esc(rec.platform)}',
      '${esc(rec.drop_id)}',
      '${esc(rec.topic)}',
      '${esc(story_slug)}',
      '${esc(rec.post_id)}',
      '${esc(rec.post_url)}',
      '${esc(rec.posted_at)}',
      '${esc(raw)}'
    )
    ON CONFLICT(platform, drop_id) DO UPDATE SET
      post_id     = excluded.post_id,
      post_url    = excluded.post_url,
      posted_at   = excluded.posted_at,
      raw_payload = excluded.raw_payload;
  `.trim().replace(/\n\s+/g, ' ');

  try {
    execSync(`sqlite3 "${DB}" "${sql.replace(/"/g, '\\"')}"`, { stdio: 'pipe' });
    console.log(`DB: social_posts upserted ${rec.platform}/${rec.drop_id}`);
  } catch (err: any) {
    // Non-fatal: JSON log is still the source for the sync poller.
    console.warn(`DB write warning (social_posts): ${err.message?.slice(0, 200)}`);
  }
}
