// Seeds demo users (and a couple of starter documents) so reviewers can test sharing immediately.
// Safe to re-run: existing users get their password reset, starter docs are only created once.
//
//   npm run seed
//
import { supabaseAdmin } from '../server/lib/supabaseAdmin.js';

const password = process.env.DEMO_USER_PASSWORD;
if (!password || password.length < 8) {
  console.error('Set DEMO_USER_PASSWORD (8+ chars) in .env first.');
  process.exit(1);
}

export const DEMO_USERS = [
  { email: 'alice@example.com', name: 'Alice Park' },
  { email: 'bob@example.com', name: 'Bob Rivera' },
  { email: 'carol@example.com', name: 'Carol Singh' },
];

const db = supabaseAdmin();

async function upsertUser({ email, name }) {
  const { data: list, error: listErr } = await db.auth.admin.listUsers({ perPage: 200 });
  if (listErr) throw listErr;
  const existing = list.users.find((u) => u.email?.toLowerCase() === email);

  let id;
  if (existing) {
    const { error } = await db.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: { name },
    });
    if (error) throw error;
    id = existing.id;
  } else {
    const { data, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error) throw error;
    id = data.user.id;
  }

  // The on_auth_user_created trigger normally creates the profile; upsert keeps the name in sync on re-runs.
  const { error: profErr } = await db.from('profiles').upsert({ id, email, name });
  if (profErr) throw profErr;
  return id;
}

const p = (text, marks) => ({ type: 'paragraph', content: [{ type: 'text', text, ...(marks ? { marks } : {}) }] });
const h = (level, text) => ({ type: 'heading', attrs: { level }, content: [{ type: 'text', text }] });
const ul = (items) => ({
  type: 'bulletList',
  content: items.map((t) => ({ type: 'listItem', content: [p(t)] })),
});

async function ensureDoc(ownerId, title, content, shares) {
  const { data: found } = await db
    .from('documents')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('title', title)
    .maybeSingle();
  if (found) return;

  const { data: doc, error } = await db
    .from('documents')
    .insert({ owner_id: ownerId, title, content: { type: 'doc', content } })
    .select('id')
    .single();
  if (error) throw error;

  if (shares.length) {
    const { error: shareErr } = await db
      .from('document_shares')
      .insert(shares.map((s) => ({ document_id: doc.id, ...s })));
    if (shareErr) throw shareErr;
  }
}

const ids = {};
for (const u of DEMO_USERS) {
  ids[u.email] = await upsertUser(u);
  console.log(`✓ ${u.name} <${u.email}>`);
}

const alice = ids['alice@example.com'];
const bob = ids['bob@example.com'];

await ensureDoc(
  alice,
  'Welcome to Quire',
  [
    h(1, 'Welcome to Quire'),
    p('A quiet place to write, edit and share documents.'),
    h(2, 'Try it out'),
    ul([
      'Format text with the toolbar or Ctrl+B / Ctrl+I / Ctrl+U',
      'Click Share to give someone viewer or editor access',
      'Import a .txt, .md or .docx file from the dashboard',
    ]),
    p('Bob can read this document but cannot edit it.', [{ type: 'italic' }]),
  ],
  [{ user_id: bob, role: 'viewer' }],
);

await ensureDoc(
  bob,
  'Q3 planning notes',
  [
    h(1, 'Q3 planning notes'),
    p('Alice has editor access to this document, so she can change it.'),
    h(2, 'Priorities'),
    ul(['Ship the editor', 'Tighten sharing', 'Write the docs']),
  ],
  [{ user_id: alice, role: 'editor' }],
);

console.log('✓ starter documents ready');
