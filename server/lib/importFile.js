import mammoth from 'mammoth';
import { marked } from 'marked';
import { HttpError } from './httpError.js';

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024; // 2 MB
export const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.markdown', '.docx'];

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function extensionOf(name = '') {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i).toLowerCase();
}

/** "Q3 Plan (final).docx" → "Q3 Plan (final)" */
export function titleFromFilename(name = '') {
  const ext = extensionOf(name);
  const base = (ext ? name.slice(0, -ext.length) : name).replace(/[_]+/g, ' ').trim();
  return (base || 'Imported document').slice(0, 200);
}

function decodeUtf8(buffer) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer).replace(/^﻿/, '');
  } catch {
    throw new HttpError(400, "This file isn't valid UTF-8 text");
  }
}

/** Plain text → paragraphs. Blank lines separate paragraphs; single newlines become line breaks. */
export function textToHtml(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/**
 * Converts an uploaded file into HTML that the editor can load.
 * The HTML is NOT trusted: the client parses it through the editor's schema, which keeps only
 * supported nodes and marks (paragraphs, headings, lists, bold/italic/underline...) and drops the rest.
 */
export async function fileToHtml({ originalname, buffer }) {
  const ext = extensionOf(originalname);
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new HttpError(415, 'Unsupported file type. Upload a .txt, .md or .docx file.');
  }
  if (!buffer?.length) throw new HttpError(400, 'The file is empty');

  if (ext === '.docx') {
    // .docx is a zip archive; check the "PK" signature before handing it to mammoth
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      throw new HttpError(400, "This doesn't look like a valid .docx file");
    }
    try {
      const { value } = await mammoth.convertToHtml({ buffer });
      return value;
    } catch {
      throw new HttpError(400, "Couldn't read this .docx file. It may be corrupted.");
    }
  }

  const text = decodeUtf8(buffer);
  if (!text.trim()) throw new HttpError(400, 'The file is empty');
  return ext === '.txt' ? textToHtml(text) : await marked.parse(text, { gfm: true });
}
