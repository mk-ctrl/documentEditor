import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { fileToHtml, textToHtml, titleFromFilename } from '../lib/importFile.js';
import { createApp } from '../app.js';
import { buildDocx } from './helpers/docx.js';

const file = (name, content) => ({ originalname: name, buffer: Buffer.isBuffer(content) ? content : Buffer.from(content) });

describe('fileToHtml', () => {
  it('.txt → paragraphs, escaping any HTML', async () => {
    const html = await fileToHtml(file('notes.txt', 'Hello <script>x</script>\n\nSecond para\nline two'));
    expect(html).toBe('<p>Hello &lt;script&gt;x&lt;/script&gt;</p><p>Second para<br>line two</p>');
  });

  it('.md → headings, emphasis and lists', async () => {
    const html = await fileToHtml(file('plan.md', '# Plan\n\nSome **bold** and *italic*.\n\n- one\n- two\n\n1. first\n'));
    expect(html).toContain('<h1>Plan</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toMatch(/<ul>\s*<li>one<\/li>/);
    expect(html).toContain('<ol>');
  });

  it('.docx → keeps the heading and bold formatting', async () => {
    const html = await fileToHtml(file('review.docx', await buildDocx()));
    expect(html).toContain('<h1>Quarterly review</h1>');
    expect(html).toContain('<strong>Revenue grew</strong>');
  });

  it('rejects unsupported, empty, fake and non-UTF-8 files', async () => {
    await expect(fileToHtml(file('slides.pdf', '%PDF-1.4'))).rejects.toMatchObject({ status: 415 });
    await expect(fileToHtml(file('empty.txt', '   \n'))).rejects.toMatchObject({ status: 400 });
    await expect(fileToHtml(file('fake.docx', 'not a zip'))).rejects.toMatchObject({ status: 400 });
    await expect(fileToHtml(file('latin1.txt', Buffer.from([0xff, 0xfe, 0xe9])))).rejects.toMatchObject({ status: 400 });
  });
});

describe('helpers', () => {
  it('titleFromFilename strips the extension and underscores', () => {
    expect(titleFromFilename('Q3_planning notes.docx')).toBe('Q3 planning notes');
    expect(titleFromFilename('.md')).toBe('Imported document');
  });
  it('textToHtml normalises Windows line endings', () => {
    expect(textToHtml('a\r\nb\r\n\r\nc')).toBe('<p>a<br>b</p><p>c</p>');
  });
});

describe('POST /api/documents/import', () => {
  const app = createApp();
  it('requires sign-in before accepting uploads', async () => {
    const res = await request(app).post('/api/documents/import').attach('file', Buffer.from('hi'), 'a.txt');
    expect(res.status).toBe(401);
  });
});
