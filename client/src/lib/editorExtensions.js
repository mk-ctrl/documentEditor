import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { generateJSON } from '@tiptap/core';

// The editor's feature set, kept to what the product supports.
// Shared by the editor and the importer, so imported content can only contain what the editor can show.
export const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    code: false,
    codeBlock: false,
    link: false,
  }),
  Placeholder.configure({ placeholder: 'Start writing…' }),
];

/**
 * Untrusted HTML (from an imported file) → editor JSON.
 * Parsing goes through the editor schema, so scripts, styles, images, links, tables and other
 * unsupported markup are dropped and only paragraphs, headings, lists and basic marks survive.
 */
export function htmlToDoc(html) {
  const doc = generateJSON(html, editorExtensions);
  if (!doc.content?.length) doc.content = [{ type: 'paragraph' }];
  return doc;
}
