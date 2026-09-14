/**
 * Zero-dependency .docx reader.
 *
 * A .docx file is a ZIP archive; the document body lives in `word/document.xml`.
 * We unzip only that entry (STORE or DEFLATE) with Node's built-in zlib and walk
 * the body in document order, returning paragraphs and tables as plain data:
 *
 *   readDocx(path) -> [
 *     { type: 'p',     text: 'Doctor: What brings you in today?' },
 *     { type: 'table', rows: [ ['English', 'Uzbek'], ['fever', 'isitma'] ] },
 *   ]
 *
 * Line breaks inside a paragraph (<w:br/>) are preserved as '\n' so that
 * multi-line cells ("phrase ⏎ Uzbek: ... ⏎ Russian: ...") can be split later.
 */
const fs = require('fs');
const zlib = require('zlib');

const SIG_EOCD = 0x06054b50;
const SIG_CDIR = 0x02014b50;

function readZipEntry(buf, wantedName) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === SIG_EOCD) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a valid .docx (zip end-of-central-directory not found)');

  const entryCount = buf.readUInt16LE(eocd + 10);
  let offset = buf.readUInt32LE(eocd + 16);

  for (let n = 0; n < entryCount; n++) {
    if (buf.readUInt32LE(offset) !== SIG_CDIR) throw new Error('Corrupt zip central directory');
    const method      = buf.readUInt16LE(offset + 10);
    const compSize    = buf.readUInt32LE(offset + 20);
    const nameLen     = buf.readUInt16LE(offset + 28);
    const extraLen    = buf.readUInt16LE(offset + 30);
    const commentLen  = buf.readUInt16LE(offset + 32);
    const localOffset = buf.readUInt32LE(offset + 42);
    const name        = buf.slice(offset + 46, offset + 46 + nameLen).toString('utf8');

    if (name === wantedName) {
      const lNameLen  = buf.readUInt16LE(localOffset + 26);
      const lExtraLen = buf.readUInt16LE(localOffset + 28);
      const start     = localOffset + 30 + lNameLen + lExtraLen;
      const data      = buf.slice(start, start + compSize);
      if (method === 0) return data;
      if (method === 8) return zlib.inflateRawSync(data);
      throw new Error(`Unsupported zip compression method ${method}`);
    }
    offset += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

function decodeXml(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&');
}

/** Text of one <w:p> element: runs, tabs and line breaks. */
function paragraphText(pXml) {
  let out = '';
  const re = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\s*\/>|<w:br(?:\s[^>]*)?\/>|<w:cr\s*\/>/g;
  let m;
  while ((m = re.exec(pXml))) {
    if (m[0].startsWith('<w:t')) out += decodeXml(m[1]);
    else if (m[0].startsWith('<w:tab')) out += '\t';
    else out += '\n';
  }
  return out;
}

/** Index just past the matching close tag, honouring nesting of the same tag. */
function findClose(s, start, tag) {
  const open = '<' + tag, close = '</' + tag + '>';
  let depth = 0, i = start;
  while (i < s.length) {
    const o = s.indexOf(open, i), c = s.indexOf(close, i);
    if (c < 0) return s.length;
    const isRealOpen = o >= 0 && o < c && (s[o + open.length] === '>' || s[o + open.length] === ' ');
    if (isRealOpen) { depth++; i = o + open.length; }
    else { depth--; i = c + close.length; if (depth === 0) return i; }
  }
  return s.length;
}

function isTagAt(s, idx, tag) {
  const ch = s[idx + tag.length + 1];
  return s.startsWith('<' + tag, idx) && (ch === '>' || ch === ' ' || ch === '/');
}

function parseTable(tblXml) {
  const rows = [];
  const inner = tblXml.slice(tblXml.indexOf('>') + 1);
  let i = 0;
  while (true) {
    const trStart = inner.indexOf('<w:tr', i);
    if (trStart < 0) break;
    if (!isTagAt(inner, trStart, 'w:tr')) { i = trStart + 5; continue; }
    const trEnd = findClose(inner, trStart, 'w:tr');
    const trXml = inner.slice(trStart, trEnd);
    const cells = [];
    let j = 0;
    while (true) {
      const tcStart = trXml.indexOf('<w:tc', j);
      if (tcStart < 0) break;
      if (!isTagAt(trXml, tcStart, 'w:tc')) { j = tcStart + 5; continue; }
      const tcEnd = findClose(trXml, tcStart, 'w:tc');
      const tcXml = trXml.slice(tcStart, tcEnd);
      const paras = [];
      const pre = /<w:p[ >\/][\s\S]*?<\/w:p>|<w:p\/>/g;
      let pm;
      while ((pm = pre.exec(tcXml))) paras.push(paragraphText(pm[0]));
      cells.push(paras.join('\n').trim());
      j = tcEnd;
    }
    rows.push(cells);
    i = trEnd;
  }
  return rows;
}

function parseBody(xml) {
  const bodyStart = xml.indexOf('<w:body>');
  const body = bodyStart >= 0 ? xml.slice(bodyStart + 8) : xml;
  const blocks = [];
  let i = 0;
  while (i < body.length) {
    let pIdx = body.indexOf('<w:p', i);
    while (pIdx >= 0 && !isTagAt(body, pIdx, 'w:p')) pIdx = body.indexOf('<w:p', pIdx + 1);
    const tIdx = body.indexOf('<w:tbl>', i);
    if (pIdx < 0 && tIdx < 0) break;

    if (tIdx >= 0 && (pIdx < 0 || tIdx < pIdx)) {
      const end = findClose(body, tIdx, 'w:tbl');
      blocks.push({ type: 'table', rows: parseTable(body.slice(tIdx, end)) });
      i = end;
    } else {
      const end = body.indexOf('</w:p>', pIdx);
      if (end < 0) break;
      blocks.push({ type: 'p', text: paragraphText(body.slice(pIdx, end + 6)) });
      i = end + 6;
    }
  }
  return blocks;
}

/**
 * @param {string} filePath
 * @returns {Array<{type:'p',text:string}|{type:'table',rows:string[][]}>}
 */
function readDocx(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.length === 0) throw new Error('File is empty (0 bytes)');
  const entry = readZipEntry(buf, 'word/document.xml');
  if (!entry) throw new Error('word/document.xml not found inside the .docx');
  return parseBody(entry.toString('utf8'));
}

module.exports = { readDocx };
