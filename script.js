/* ── script.js ─────────────────────────────────────────
   Peppy Collections – Courier Slip Generator
   Vanilla JS, no frameworks.
───────────────────────────────────────────────────────── */

'use strict';

/* ══════════════════════════════════════════════════════
   CONSTANTS & STATE
   ══════════════════════════════════════════════════════ */
const DEFAULT_FROM = {
  business : 'Peppy Collections',
  contact  : 'Yamini Mamallan',
  address  : 'Ponneri – 601204',
  mobile   : '6380102246'
};

const LS_FROM_KEY       = 'peppyCollections_fromAddress';
const LS_RECIPIENTS_KEY = 'peppyCollections_recipients';

let fromAddress  = loadFromAddress();
let recipients   = loadRecipients();
let editingIndex = null;        // index of recipient being edited

/* ══════════════════════════════════════════════════════
   LOCAL STORAGE HELPERS
   ══════════════════════════════════════════════════════ */
function loadFromAddress() {
  try {
    const stored = localStorage.getItem(LS_FROM_KEY);
    return stored ? JSON.parse(stored) : { ...DEFAULT_FROM };
  } catch { return { ...DEFAULT_FROM }; }
}

function saveFromAddress(addr) {
  localStorage.setItem(LS_FROM_KEY, JSON.stringify(addr));
}

function loadRecipients() {
  try {
    const stored = localStorage.getItem(LS_RECIPIENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveRecipients() {
  localStorage.setItem(LS_RECIPIENTS_KEY, JSON.stringify(recipients));
}

/* ══════════════════════════════════════════════════════
   VALIDATION HELPERS
   ══════════════════════════════════════════════════════ */
function isValidMobile(num) {
  return /^[6-9]\d{9}$/.test(num.trim());
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearError(el) {
  el.textContent = '';
  el.classList.add('hidden');
}

/* ══════════════════════════════════════════════════════
   FROM ADDRESS – DISPLAY
   ══════════════════════════════════════════════════════ */
function renderFromDisplay() {
  const el = document.getElementById('from-lines-display');
  el.innerHTML = `
    <strong>${esc(fromAddress.business)}</strong><br>
    ${esc(fromAddress.contact)}<br>
    ${esc(fromAddress.address)}<br>
    <span>📱 ${esc(fromAddress.mobile)}</span>
  `;
}

/* ══════════════════════════════════════════════════════
   FROM ADDRESS – EDIT PANEL
   ══════════════════════════════════════════════════════ */
function openFromEdit() {
  document.getElementById('from-display').classList.add('hidden');
  document.getElementById('from-edit').classList.remove('hidden');
  document.getElementById('from-business').value = fromAddress.business;
  document.getElementById('from-contact').value  = fromAddress.contact;
  document.getElementById('from-address').value  = fromAddress.address;
  document.getElementById('from-mobile').value   = fromAddress.mobile;
  clearError(document.getElementById('from-error'));
}

function closeFromEdit() {
  document.getElementById('from-display').classList.remove('hidden');
  document.getElementById('from-edit').classList.add('hidden');
}

function saveFromEdit() {
  const errEl    = document.getElementById('from-error');
  const business = document.getElementById('from-business').value.trim();
  const contact  = document.getElementById('from-contact').value.trim();
  const address  = document.getElementById('from-address').value.trim();
  const mobile   = document.getElementById('from-mobile').value.trim();

  if (!business) return showError(errEl, 'Business / Sender Name is required.');
  if (!contact)  return showError(errEl, 'Contact Person is required.');
  if (!address)  return showError(errEl, 'Address is required.');
  if (!mobile)   return showError(errEl, 'Mobile Number is required.');
  if (!isValidMobile(mobile)) return showError(errEl, 'Enter a valid 10-digit Indian mobile number starting with 6-9.');

  clearError(errEl);
  fromAddress = { business, contact, address, mobile };
  saveFromAddress(fromAddress);
  renderFromDisplay();
  closeFromEdit();
}

function resetFromAddress() {
  if (!confirm('Reset to the default FROM address?')) return;
  fromAddress = { ...DEFAULT_FROM };
  saveFromAddress(fromAddress);
  renderFromDisplay();
  closeFromEdit();
}

/* ══════════════════════════════════════════════════════
   RECIPIENT TABLE
   ══════════════════════════════════════════════════════ */
function renderRecipientTable() {
  const tbody    = document.getElementById('recipient-tbody');
  const countEl  = document.getElementById('recipient-count');
  const emptyRow = document.getElementById('empty-row');

  // Remove all rows except the empty-state template
  [...tbody.querySelectorAll('tr:not(#empty-row)')].forEach(r => r.remove());

  if (recipients.length === 0) {
    emptyRow.classList.remove('hidden');
    countEl.textContent = '0 recipients';
    return;
  }

  emptyRow.classList.add('hidden');
  countEl.textContent = `${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`;

  recipients.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td><strong>${esc(r.name)}</strong></td>
      <td class="td-addr">${esc(r.address)}</td>
      <td>${esc(r.mobile)}</td>
      <td>
        <button class="btn btn-secondary btn-icon btn-edit-row" data-idx="${i}" title="Edit">✏️</button>
        <button class="btn btn-danger    btn-icon btn-del-row"  data-idx="${i}" title="Delete">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach row-level listeners
  tbody.querySelectorAll('.btn-edit-row').forEach(btn =>
    btn.addEventListener('click', () => openEditModal(+btn.dataset.idx)));
  tbody.querySelectorAll('.btn-del-row').forEach(btn =>
    btn.addEventListener('click', () => deleteRecipient(+btn.dataset.idx)));
}

/* ══════════════════════════════════════════════════════
   ADD RECIPIENT
   ══════════════════════════════════════════════════════ */
function addRecipient() {
  const errEl   = document.getElementById('add-error');
  const name    = document.getElementById('to-name').value.trim();
  const address = document.getElementById('to-address').value.trim();
  const mobile  = document.getElementById('to-mobile').value.trim();

  if (!name)    return showError(errEl, 'Recipient Name is required.');
  if (!address) return showError(errEl, 'Address is required.');
  if (!mobile)  return showError(errEl, 'Mobile Number is required.');
  if (!isValidMobile(mobile)) return showError(errEl, 'Enter a valid 10-digit Indian mobile number starting with 6-9.');

  clearError(errEl);
  recipients.push({ name, address, mobile });
  saveRecipients();
  renderRecipientTable();

  // Clear inputs
  document.getElementById('to-name').value    = '';
  document.getElementById('to-address').value = '';
  document.getElementById('to-mobile').value  = '';
  document.getElementById('to-name').focus();
}

/* ══════════════════════════════════════════════════════
   EDIT RECIPIENT MODAL
   ══════════════════════════════════════════════════════ */
function openEditModal(idx) {
  editingIndex = idx;
  const r = recipients[idx];
  document.getElementById('edit-name').value    = r.name;
  document.getElementById('edit-address').value = r.address;
  document.getElementById('edit-mobile').value  = r.mobile;
  clearError(document.getElementById('edit-error'));
  document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
  editingIndex = null;
  document.getElementById('edit-modal').classList.add('hidden');
}

function saveEditModal() {
  const errEl   = document.getElementById('edit-error');
  const name    = document.getElementById('edit-name').value.trim();
  const address = document.getElementById('edit-address').value.trim();
  const mobile  = document.getElementById('edit-mobile').value.trim();

  if (!name)    return showError(errEl, 'Recipient Name is required.');
  if (!address) return showError(errEl, 'Address is required.');
  if (!mobile)  return showError(errEl, 'Mobile Number is required.');
  if (!isValidMobile(mobile)) return showError(errEl, 'Enter a valid 10-digit Indian mobile number starting with 6-9.');

  clearError(errEl);
  recipients[editingIndex] = { name, address, mobile };
  saveRecipients();
  renderRecipientTable();
  closeEditModal();
}

/* ══════════════════════════════════════════════════════
   DELETE RECIPIENT
   ══════════════════════════════════════════════════════ */
function deleteRecipient(idx) {
  if (!confirm(`Delete recipient "${recipients[idx].name}"?`)) return;
  recipients.splice(idx, 1);
  saveRecipients();
  renderRecipientTable();
}

/* ══════════════════════════════════════════════════════
   CLEAR ALL
   ══════════════════════════════════════════════════════ */
function clearAllRecipients() {
  if (recipients.length === 0) return alert('No recipients to clear.');
  if (!confirm(`Clear all ${recipients.length} recipient(s)? This cannot be undone.`)) return;
  recipients = [];
  saveRecipients();
  renderRecipientTable();
  hidePreview();
}

/* ══════════════════════════════════════════════════════
   SLIP HTML BUILDER
   ══════════════════════════════════════════════════════ */
function buildSlipHTML(toRecipient) {
  return `
    <div class="slip">
      <div class="slip-half slip-from">
        <div class="slip-label">FROM</div>
        <div class="slip-business">${esc(fromAddress.business)}</div>
        <div class="slip-contact">${esc(fromAddress.contact)}</div>
        <div class="slip-addr">${esc(fromAddress.address)}</div>
        <div class="slip-mobile">📱 ${esc(fromAddress.mobile)}</div>
      </div>
      <div class="slip-half slip-to">
        <div class="slip-label">TO</div>
        <div class="slip-business">${esc(toRecipient.name)}</div>
        <div class="slip-addr">${esc(toRecipient.address)}</div>
        <div class="slip-mobile">📱 ${esc(toRecipient.mobile)}</div>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════════
   BUILD A4 PAGES
   ══════════════════════════════════════════════════════ */
function buildPrintPages() {
  const SLIPS_PER_PAGE = 3;
  const printArea = document.getElementById('print-area');
  printArea.innerHTML = '';

  const totalPages = Math.ceil(recipients.length / SLIPS_PER_PAGE);

  for (let p = 0; p < totalPages; p++) {
    const pageDiv = document.createElement('div');
    pageDiv.className = 'a4-page';

    const startIdx = p * SLIPS_PER_PAGE;
    const pageRecipients = recipients.slice(startIdx, startIdx + SLIPS_PER_PAGE);

    // Fill up to 3 slips; if fewer, add blank spacer slips to maintain layout
    pageRecipients.forEach(r => {
      pageDiv.insertAdjacentHTML('beforeend', buildSlipHTML(r));
    });

    // Add blank filler slips if page is not full (keeps spacing on partial pages)
    for (let f = pageRecipients.length; f < SLIPS_PER_PAGE; f++) {
      pageDiv.insertAdjacentHTML('beforeend', `<div class="slip" style="border-style:dashed;opacity:.3;"></div>`);
    }

    printArea.appendChild(pageDiv);
  }

  // Label
  const totalRecips = recipients.length;
  document.getElementById('preview-label').textContent =
    `Preview — ${totalRecips} recipient${totalRecips !== 1 ? 's' : ''} · ${totalPages} A4 page${totalPages !== 1 ? 's' : ''}`;
}

/* ══════════════════════════════════════════════════════
   PREVIEW SHOW / HIDE
   ══════════════════════════════════════════════════════ */
function showPreview() {
  if (recipients.length === 0) return alert('Add at least one recipient before generating a preview.');
  buildPrintPages();
  document.getElementById('preview-section').classList.remove('hidden');
  document.getElementById('preview-section').scrollIntoView({ behavior: 'smooth' });
}

function hidePreview() {
  document.getElementById('preview-section').classList.add('hidden');
  document.getElementById('print-area').innerHTML = '';
}

/* ══════════════════════════════════════════════════════
   PRINT / PDF
   ══════════════════════════════════════════════════════ */
function doPrint() {
  if (recipients.length === 0) return alert('Add at least one recipient before printing.');
  if (document.getElementById('preview-section').classList.contains('hidden')) {
    buildPrintPages();
    document.getElementById('preview-section').classList.remove('hidden');
  }
  setTimeout(() => window.print(), 200);
}

/* ══════════════════════════════════════════════════════
   WORD (.docx) EXPORT
   ══════════════════════════════════════════════════════ */
function downloadDocx() {
  if (recipients.length === 0) return alert('Add at least one recipient before downloading.');

  // Check docx library
  if (typeof docx === 'undefined') {
    return alert('Word export library is loading. Please ensure you have an internet connection and try again in a moment.');
  }

  const {
    Document, Packer, Paragraph, Table, TableRow, TableCell,
    TextRun, WidthType, BorderStyle, AlignmentType,
    ShadingType, HeightRule, PageBreak, VerticalAlign
  } = docx;

  const SLIPS_PER_PAGE = 3;
  const A4_WIDTH_DXA   = 11906;   // A4 portrait in twips
  const MARGIN_DXA     = 1134;    // ~20 mm
  const CONTENT_WIDTH  = A4_WIDTH_DXA - 2 * MARGIN_DXA; // usable width
  const HALF_WIDTH     = Math.floor(CONTENT_WIDTH / 2);

  const BORDER = { style: BorderStyle.SINGLE, size: 10, color: '333333' };
  const DIVIDER = { style: BorderStyle.SINGLE, size: 10, color: '333333' };
  const NO_BORDER = { style: BorderStyle.NIL };

  /* Helper: bold run */
  const bold = (text, sz = 20) => new TextRun({ text, bold: true, size: sz });
  const reg  = (text, sz = 19) => new TextRun({ text, size: sz });
  const br   = ()               => new TextRun({ break: 1 });

  /* Build a single slip table */
  function makeSlipTable(recipient) {
    const fromParas = [
      new Paragraph({ children: [bold('FROM', 18)], spacing: { after: 60 } }),
      new Paragraph({ children: [bold(fromAddress.business, 22)], spacing: { after: 40 } }),
      new Paragraph({ children: [reg(fromAddress.contact, 19)], spacing: { after: 20 } }),
      new Paragraph({ children: [reg(fromAddress.address, 19)], spacing: { after: 20 } }),
      new Paragraph({ children: [bold('Mobile: ' + fromAddress.mobile, 19)] }),
    ];

    const toParas = recipient ? [
      new Paragraph({ children: [bold('TO', 18)], spacing: { after: 60 } }),
      new Paragraph({ children: [bold(recipient.name, 24)], spacing: { after: 40 } }),
      new Paragraph({ children: [reg(recipient.address, 19)], spacing: { after: 20 } }),
      new Paragraph({ children: [bold('Mobile: ' + recipient.mobile, 19)] }),
    ] : [
      new Paragraph({ children: [reg('', 19)] })
    ];

    return new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      borders: {
        top:    BORDER,
        bottom: BORDER,
        left:   BORDER,
        right:  BORDER,
        insideH: NO_BORDER,
        insideV: DIVIDER,
      },
      rows: [
        new TableRow({
          height: { value: 1700, rule: HeightRule.ATLEAST },
          children: [
            new TableCell({
              width: { size: HALF_WIDTH, type: WidthType.DXA },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: fromParas,
            }),
            new TableCell({
              width: { size: HALF_WIDTH, type: WidthType.DXA },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: toParas,
            }),
          ]
        })
      ]
    });
  }

  /* Spacer paragraph between slips */
  const spacer = () => new Paragraph({ text: '', spacing: { after: 60 } });

  const sections = [];
  const TOTAL_PAGES = Math.ceil(recipients.length / SLIPS_PER_PAGE);

  for (let p = 0; p < TOTAL_PAGES; p++) {
    const pageChildren = [];
    const startIdx = p * SLIPS_PER_PAGE;
    const pageRecips = recipients.slice(startIdx, startIdx + SLIPS_PER_PAGE);

    pageRecips.forEach((r, i) => {
      pageChildren.push(makeSlipTable(r));
      if (i < pageRecips.length - 1) pageChildren.push(spacer());
    });

    // Fill remaining slip slots with blank tables
    for (let f = pageRecips.length; f < SLIPS_PER_PAGE; f++) {
      pageChildren.push(spacer());
      pageChildren.push(makeSlipTable(null));
    }

    // Page break after every page except last
    if (p < TOTAL_PAGES - 1) {
      pageChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }

    sections.push(...pageChildren);
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: A4_WIDTH_DXA, height: 16838 },
          margin: { top: MARGIN_DXA, bottom: MARGIN_DXA, left: MARGIN_DXA, right: MARGIN_DXA }
        }
      },
      children: sections
    }]
  });

  Packer.toBlob(doc).then(blob => {
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href  = url;
    link.download = `Courier_Slips_${todayStr()}.docx`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }).catch(err => {
    console.error('DOCX error:', err);
    alert('Word export failed. Check the console for details.');
  });
}

/* ══════════════════════════════════════════════════════
   UTILITY
   ══════════════════════════════════════════════════════ */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ══════════════════════════════════════════════════════
   EVENT WIRING
   ══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  // ── FROM address ──
  document.getElementById('btn-edit-from').addEventListener('click', openFromEdit);
  document.getElementById('btn-save-from').addEventListener('click', saveFromEdit);
  document.getElementById('btn-cancel-from').addEventListener('click', closeFromEdit);
  document.getElementById('btn-reset-from').addEventListener('click', resetFromAddress);

  // Clear error on input
  ['from-business','from-contact','from-address','from-mobile'].forEach(id =>
    document.getElementById(id).addEventListener('input', () =>
      clearError(document.getElementById('from-error'))));

  // ── Add recipient ──
  document.getElementById('btn-add').addEventListener('click', addRecipient);
  ['to-name','to-address','to-mobile'].forEach(id =>
    document.getElementById(id).addEventListener('input', () =>
      clearError(document.getElementById('add-error'))));

  // Enter key in recipient form fields → add
  ['to-name','to-mobile'].forEach(id =>
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') addRecipient();
    }));
  document.getElementById('to-address').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addRecipient(); }
  });

  // ── Edit modal ──
  document.getElementById('btn-save-edit').addEventListener('click', saveEditModal);
  document.getElementById('btn-cancel-edit').addEventListener('click', closeEditModal);
  document.getElementById('edit-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('edit-modal')) closeEditModal();
  });
  ['edit-name','edit-address','edit-mobile'].forEach(id =>
    document.getElementById(id).addEventListener('input', () =>
      clearError(document.getElementById('edit-error'))));

  // ── Action buttons ──
  document.getElementById('btn-preview').addEventListener('click', showPreview);
  document.getElementById('btn-print').addEventListener('click', doPrint);
  document.getElementById('btn-pdf').addEventListener('click', doPrint);     // triggers print-to-PDF
  document.getElementById('btn-docx').addEventListener('click', downloadDocx);
  document.getElementById('btn-clear').addEventListener('click', clearAllRecipients);

  // Preview toolbar buttons
  document.getElementById('btn-print2').addEventListener('click', doPrint);
  document.getElementById('btn-pdf2').addEventListener('click', doPrint);
  document.getElementById('btn-docx2').addEventListener('click', downloadDocx);
  document.getElementById('btn-close-preview').addEventListener('click', hidePreview);

  // ── Initial render ──
  renderFromDisplay();
  renderRecipientTable();
});
