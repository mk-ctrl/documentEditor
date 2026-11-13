// Integration tests against the real Supabase project, using the seeded demo users.
// Skipped automatically when .env isn't configured. Run `npm run seed` first.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createClient } from '@supabase/supabase-js';
import { createApp } from '../app.js';

const env = process.env;
const configured = Boolean(
  env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && env.VITE_SUPABASE_ANON_KEY && env.DEMO_USER_PASSWORD,
);

async function tokenFor(email) {
  const client = createClient(env.SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password: env.DEMO_USER_PASSWORD });
  if (error) throw error;
  return data.session.access_token;
}

describe.skipIf(!configured)('documents API (integration)', () => {
  const app = createApp();
  const tokens = {};
  const as = (who) => ({ Authorization: `Bearer ${tokens[who]}` });
  const created = [];

  beforeAll(async () => {
    [tokens.alice, tokens.bob, tokens.carol] = await Promise.all(
      ['alice', 'bob', 'carol'].map((n) => tokenFor(`${n}@example.com`)),
    );
  });

  afterAll(async () => {
    for (const id of created) await request(app).delete(`/api/documents/${id}`).set(as('alice'));
  });

  it('owner can create, rename, save formatted content, reopen and delete', async () => {
    const create = await request(app).post('/api/documents').set(as('alice')).send({ title: 'Test doc' });
    expect(create.status).toBe(201);
    const id = create.body.id;
    created.push(id);

    const content = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Hello' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'bold', marks: [{ type: 'bold' }] }] },
      ],
    };
    const patch = await request(app).patch(`/api/documents/${id}`).set(as('alice')).send({ title: 'Renamed', content });
    expect(patch.status).toBe(200);

    const reopened = await request(app).get(`/api/documents/${id}`).set(as('alice'));
    expect(reopened.status).toBe(200);
    expect(reopened.body.title).toBe('Renamed');
    expect(reopened.body.content).toEqual(content); // formatting survives the round trip exactly
    expect(reopened.body.role).toBe('owner');

    const del = await request(app).delete(`/api/documents/${id}`).set(as('alice'));
    expect(del.status).toBe(204);
    created.pop();
    expect((await request(app).get(`/api/documents/${id}`).set(as('alice'))).status).toBe(404);
  });

  it('separates owned and shared documents in the list', async () => {
    const res = await request(app).get('/api/documents').set(as('bob'));
    expect(res.status).toBe(200);
    const welcome = res.body.shared.find((d) => d.title === 'Welcome to Quire');
    expect(welcome).toMatchObject({ role: 'viewer', owner: { email: 'alice@example.com' } });
    expect(res.body.owned.some((d) => d.title === 'Q3 planning notes')).toBe(true);
  });

  it('enforces viewer / stranger permissions on the server', async () => {
    const list = await request(app).get('/api/documents').set(as('alice'));
    const welcome = list.body.owned.find((d) => d.title === 'Welcome to Quire');

    const bobRead = await request(app).get(`/api/documents/${welcome.id}`).set(as('bob'));
    expect(bobRead.status).toBe(200);
    expect(bobRead.body.role).toBe('viewer');

    const bobWrite = await request(app).patch(`/api/documents/${welcome.id}`).set(as('bob')).send({ title: 'hacked' });
    expect(bobWrite.status).toBe(403);

    const carolRead = await request(app).get(`/api/documents/${welcome.id}`).set(as('carol'));
    expect(carolRead.status).toBe(403);

    const bobDelete = await request(app).delete(`/api/documents/${welcome.id}`).set(as('bob'));
    expect(bobDelete.status).toBe(403);
  });

  it('validates input', async () => {
    const empty = await request(app).post('/api/documents').set(as('alice')).send({ title: '   ' });
    expect(empty.status).toBe(400);
    expect(empty.body.error).toMatch(/empty/i);

    const extra = await request(app).post('/api/documents').set(as('alice')).send({ owner_id: 'someone-else' });
    expect(extra.status).toBe(400); // can't spoof ownership

    const badId = await request(app).get('/api/documents/not-a-uuid').set(as('alice'));
    expect(badId.status).toBe(404);
  });
});
