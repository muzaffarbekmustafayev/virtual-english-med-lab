/**
 * Clinical dialogue extraction ("Doctor: … / Patient: …" files).
 *
 * Accepts speaker-labelled paragraphs (several labels may share one paragraph
 * separated by line breaks), 2-column "Speaker | Dialogue" tables and
 * "Doctor | "…" " sample tables. Also picks up the header lines that precede the
 * dialogue (module title, grammar focus, setting) because several authors put
 * the canonical module title only there.
 */
const T = require('./text');

const DOCTOR_RE  = /^(doctor|dr\.?|shifokor|врач|physician|dentist|clinician|gp|paediatrician|pediatrician)\b\s*(?:\([^)]*\))?\s*:\s*/i;
const OTHER_RE   = /^(patient|pt\.?|bemor|пациент|parent|mother|father|mum|mom|dad|relative|paramedic|caregiver|son|daughter|wife|husband|nurse|hamshira|медсестра|student|friend|witness|colleague|receptionist|child|boy|girl|teacher)\b\s*(?:\([^)]*\))?\s*:\s*/i;

function speakerOf(line) {
  let m = line.match(DOCTOR_RE);
  if (m) return { role: 'doctor', label: T.titleCase(m[1]), text: line.slice(m[0].length).trim() };
  m = line.match(OTHER_RE);
  if (m) {
    const label = T.titleCase(m[1]);
    const role = /nurse|hamshira|медсестра/i.test(m[1]) ? 'nurse' : 'patient';
    return { role, label, text: line.slice(m[0].length).trim() };
  }
  return null;
}

/**
 * @param {Array} blocks - readDocx() output
 * @returns {{header: string[], title: string|null, grammar_focus: string|null, setting: string|null, turns: Array<{role:string,label:string,text:string}>}}
 */
function parseDialogueDoc(blocks) {
  const turns = [];
  const header = [];
  let grammar_focus = null, setting = null;
  let cur = null;

  const push = () => { if (cur && cur.text) turns.push(cur); cur = null; };
  const feedLine = (rawLine) => {
    const line = T.clean(rawLine);
    if (!line) return;
    const sp = speakerOf(line);
    if (sp) {
      push();
      cur = { role: sp.role, label: sp.label, text: T.stripQuotes(sp.text) };
      return;
    }
    if (cur) {
      // continuation of the same utterance
      if (T.detectLang(line) === 'en' && !/^(grammar focus|setting|level|topic|dialogue purpose)/i.test(line)) cur.text = (cur.text + ' ' + T.stripQuotes(line)).trim();
      return;
    }
    if (!turns.length) {
      const gf = line.match(/grammar\s*(?:&\s*communication\s*)?focus\s*[:—-]\s*(.+)/i);
      if (gf) { grammar_focus = grammar_focus || gf[1].trim(); return; }
      const st = line.match(/^setting\s*[:—-]\s*(.+)/i);
      if (st) { setting = st[1].trim(); return; }
      if (header.length < 8) header.push(line);
    }
  };

  for (const b of blocks) {
    if (b.type === 'p') {
      for (const l of T.splitLines(b.text)) feedLine(l);
    } else if (b.type === 'table') {
      const rows = b.rows;
      if (!rows.length) continue;
      const twoCol = rows.every(r => r.length >= 2);
      if (!twoCol) { rows.forEach(r => r.forEach(c => T.splitLines(c).forEach(feedLine))); continue; }
      for (const r of rows) {
        const spk = T.clean(r[0]), txt = T.clean(r[1]);
        if (!spk || !txt) continue;
        if (/^speaker$/i.test(spk)) continue;
        const sp = speakerOf(spk + ': ' + txt);
        if (sp) { push(); cur = { role: sp.role, label: sp.label, text: T.stripQuotes(sp.text) }; push(); }
        else T.splitLines(txt).forEach(feedLine);
      }
    }
  }
  push();

  // Title: first header line that is not a generic label
  let title = null;
  for (const h of header) {
    const t = h.replace(/^module\s*\d*\s*[—:-]?\s*/i, '').replace(/\s*\(.*?\)\s*$/, '').trim();
    if (!t || /^(dialogue|dialog|natural doctor|clinical dialogue|characters|level|topic|format)/i.test(t)) continue;
    if (T.detectLang(t) !== 'en') continue;
    title = t; break;
  }

  return { header, title, grammar_focus, setting, turns };
}

module.exports = { parseDialogueDoc, speakerOf };
