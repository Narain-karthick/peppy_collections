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
const SLIPS_PER_PAGE    = 4;

let fromAddress  = loadFromAddress();
let recipients   = loadRecipients();
let editingIndex = null; // index of recipient being edited

/* ══════════════════════════════════════════════════════
   LOCAL STORAGE HELPERS
   ══════════════════════════════════════════════════════ */
function loadFromAddress() {
  try {
    const stored = localStorage.getItem(LS_FROM_KEY);
    return stored ? JSON.parse(stored) : { ...DEFAULT_FROM };
  } catch {
    return { ...DEFAULT_FROM };
  }
}

function saveFromAddress(addr) {
  localStorage.setItem(LS_FROM_KEY, JSON.stringify(addr));
}

function loadRecipients() {
  try {
    const stored = localStorage.getItem(LS_RECIPIENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
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
   FROM ADDRESS – DISPLAY & EDIT
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

  // If preview is visible, update it with new sender info
  if (recipients.length > 0) {
    buildPrintPages();
  }
}

function resetFromAddress() {
  if (!confirm('Reset to the default FROM address?')) return;
  fromAddress = { ...DEFAULT_FROM };
  saveFromAddress(fromAddress);
  renderFromDisplay();
  closeFromEdit();

  if (recipients.length > 0) {
    buildPrintPages();
  }
}

/* ══════════════════════════════════════════════════════
   DASHBOARD STATS & RECIPIENT DIRECTORY
   ══════════════════════════════════════════════════════ */
function updateSummaryStats() {
  const total = recipients.length;
  const pages = Math.ceil(total / SLIPS_PER_PAGE) || 0;

  const statRecipients = document.getElementById('stat-recipients');
  if (statRecipients) statRecipients.textContent = total;

  const statPages = document.getElementById('stat-pages');
  if (statPages) statPages.textContent = pages;

  const statSlips = document.getElementById('stat-slips-per-page');
  if (statSlips) statSlips.textContent = SLIPS_PER_PAGE;

  const headerBadge = document.getElementById('header-count-text');
  if (headerBadge) headerBadge.textContent = `${total} Recipient${total !== 1 ? 's' : ''}`;

  const tableTotal = document.getElementById('table-total-count');
  if (tableTotal) tableTotal.textContent = total;

  const countEl = document.getElementById('recipient-count');
  if (countEl) countEl.textContent = `${total} recipient${total !== 1 ? 's' : ''}`;
}

function renderRecipientTable() {
  updateSummaryStats();

  const tbody       = document.getElementById('recipient-tbody');
  const emptyRow    = document.getElementById('empty-row');
  const searchInput = document.getElementById('recipient-search');
  const query       = searchInput ? searchInput.value.trim().toLowerCase() : '';

  // Remove existing rendered rows
  [...tbody.querySelectorAll('tr:not(#empty-row)')].forEach(r => r.remove());

  if (recipients.length === 0) {
    if (emptyRow) emptyRow.classList.remove('hidden');
    renderEmptyPreview();
    return;
  }

  if (emptyRow) emptyRow.classList.add('hidden');

  // Filter based on query if present
  const filtered = query
    ? recipients.map((r, i) => ({ recipient: r, originalIndex: i }))
                .filter(({ recipient: r }) =>
                  r.name.toLowerCase().includes(query) ||
                  r.mobile.toLowerCase().includes(query) ||
                  r.address.toLowerCase().includes(query)
                )
    : recipients.map((r, i) => ({ recipient: r, originalIndex: i }));

  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    tr.className = 'no-search-results';
    tr.innerHTML = `
      <td colspan="5" style="text-align: center; padding: 24px 16px; color: var(--slate-500); font-size: 0.84rem;">
        🔍 No recipients match "<strong>${esc(query)}</strong>"
      </td>
    `;
    tbody.appendChild(tr);
    buildPrintPages();
    return;
  }

  filtered.forEach(({ recipient: r, originalIndex: i }) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td><strong>${esc(r.name)}</strong></td>
      <td class="td-addr">${esc(r.address)}</td>
      <td>${esc(r.mobile)}</td>
      <td>
        <button class="btn btn-secondary btn-icon btn-edit-row" data-idx="${i}" title="Edit">✏️</button>
        <button class="btn btn-danger btn-icon btn-del-row" data-idx="${i}" title="Delete">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach row event listeners
  tbody.querySelectorAll('.btn-edit-row').forEach(btn =>
    btn.addEventListener('click', () => openEditModal(+btn.dataset.idx)));
  tbody.querySelectorAll('.btn-del-row').forEach(btn =>
    btn.addEventListener('click', () => deleteRecipient(+btn.dataset.idx)));

  // Synchronize live preview
  buildPrintPages();
}

/* ══════════════════════════════════════════════════════
   ADD RECIPIENT (COMBINED NAME & ADDRESS + MOBILE)
   ══════════════════════════════════════════════════════ */
function addRecipient() {
  const errEl         = document.getElementById('add-error');
  const nameAddrInput = document.getElementById('to-name-address');
  const mobileInput   = document.getElementById('to-mobile');

  const rawText = nameAddrInput ? nameAddrInput.value : '';
  const mobile  = mobileInput ? mobileInput.value.trim() : '';

  // Parse lines: first non-empty line = Recipient Name; remaining lines = Address
  const lines = rawText.split('\n');
  let name = '';
  let nameLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed) {
      name = trimmed;
      nameLineIndex = i;
      break;
    }
  }

  let address = '';
  if (nameLineIndex !== -1 && nameLineIndex + 1 < lines.length) {
    address = lines.slice(nameLineIndex + 1).join('\n').trim();
  }

  // Validation
  if (!name) {
    return showError(errEl, 'Please enter the recipient name on the first line.');
  }
  if (!address) {
    return showError(errEl, 'Please enter the delivery address on the lines following the name.');
  }
  if (!mobile) {
    return showError(errEl, 'Mobile Number is required.');
  }
  if (!isValidMobile(mobile)) {
    return showError(errEl, 'Enter a valid 10-digit Indian mobile number starting with 6-9.');
  }

  clearError(errEl);
  recipients.push({ name, address, mobile });
  saveRecipients();
  renderRecipientTable();

  // Clear inputs and refocus
  if (nameAddrInput) nameAddrInput.value = '';
  if (mobileInput) mobileInput.value = '';
  if (nameAddrInput) nameAddrInput.focus();
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
  if (!mobile)  return showError(errEl, 'Mobile Number is required.');
  if (!isValidMobile(mobile)) return showError(errEl, 'Enter a valid 10-digit Indian mobile number starting with 6-9.');
  if (!address) return showError(errEl, 'Address is required.');

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
   CLEAR ALL RECIPIENTS
   ══════════════════════════════════════════════════════ */
function clearAllRecipients() {
  if (recipients.length === 0) return alert('No recipients to clear.');
  if (!confirm(`Clear all ${recipients.length} recipient(s)? This cannot be undone.`)) return;
  recipients = [];
  saveRecipients();
  renderRecipientTable();
}

/* ══════════════════════════════════════════════════════
   SLIP HTML BUILDER
   ══════════════════════════════════════════════════════ */
function buildSlipHTML(toRecipient, slotNum) {
  const toContent = toRecipient ? `
    <div class="slip-label">TO</div>
    <div class="slip-business">${esc(toRecipient.name)}</div>
    <div class="slip-addr">${esc(toRecipient.address)}</div>
    <div class="slip-mobile">📱 ${esc(toRecipient.mobile)}</div>
  ` : `
    <div class="slip-label">TO</div>
    <div class="slip-business empty-slot-text" style="color: #94a3b8; font-weight: 500; font-size: 10pt; font-style: italic;">(Empty Slip ${slotNum || ''})</div>
    <div class="slip-addr"></div>
    <div class="slip-mobile"></div>
  `;

  return `
    <div class="slip${!toRecipient ? ' slip-empty-slot' : ''}">
      <div class="slip-half slip-from">
        <div class="slip-label">FROM</div>
        <div class="slip-business">${esc(fromAddress.business)}</div>
        <div class="slip-contact">${esc(fromAddress.contact)}</div>
        <div class="slip-addr">${esc(fromAddress.address)}</div>
        <div class="slip-mobile">📱 ${esc(fromAddress.mobile)}</div>
      </div>
      <div class="slip-half slip-to">
        ${toContent}
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════════
   BUILD A4 PAGES (STRICT PAGINATION: 4 SLIPS PER A4 PAGE)
   ══════════════════════════════════════════════════════ */
function buildPrintPages() {
  const printArea = document.getElementById('print-area');
  const indicatorEl = document.getElementById('preview-page-indicator');

  if (recipients.length === 0) {
    renderEmptyPreview();
    return;
  }

  printArea.innerHTML = '';

  /* STRICT PAGINATION REQUIREMENT:
     pageIndex = Math.floor(index / 4)
     slipIndex = index % 4
     Each A4 page contains max 4 slips.
     5th recipient starts on Page 2, 9th on Page 3, 13th on Page 4.
  */
  const totalPages = Math.ceil(recipients.length / SLIPS_PER_PAGE);

  // Group recipients by pageIndex
  const pageMap = {};
  recipients.forEach((recipient, index) => {
    const pageIndex = Math.floor(index / SLIPS_PER_PAGE);
    const slipIndex = index % SLIPS_PER_PAGE;
    if (!pageMap[pageIndex]) {
      pageMap[pageIndex] = {};
    }
    pageMap[pageIndex][slipIndex] = recipient;
  });

  for (let p = 0; p < totalPages; p++) {
    const pageDiv = document.createElement('div');
    pageDiv.className = 'a4-page';
    pageDiv.setAttribute('data-page-index', p);

    const startSlip = p * SLIPS_PER_PAGE + 1;
    const endSlip   = Math.min((p + 1) * SLIPS_PER_PAGE, recipients.length);

    // Screen-only page indicator header
    const pageHeader = document.createElement('div');
    pageHeader.className = 'a4-page-header no-print';
    pageHeader.innerHTML = `
      <span class="page-pill">📄 A4 Page ${p + 1} of ${totalPages}</span>
      <span class="page-sub">Recipient ${startSlip}${endSlip > startSlip ? ` to ${endSlip}` : ''}</span>
    `;
    pageDiv.appendChild(pageHeader);

    // Slips container
    const slipsContainer = document.createElement('div');
    slipsContainer.className = 'a4-slips-container';

    // Exactly 3 slips per page
    for (let s = 0; s < SLIPS_PER_PAGE; s++) {
      const recipient = pageMap[p] && pageMap[p][s];
      slipsContainer.insertAdjacentHTML('beforeend', buildSlipHTML(recipient, s + 1));
    }

    pageDiv.appendChild(slipsContainer);
    printArea.appendChild(pageDiv);
  }

  // Update card header indicator
  if (indicatorEl) {
    indicatorEl.textContent = `${totalPages} Page${totalPages > 1 ? 's' : ''} (${recipients.length} Recipient${recipients.length !== 1 ? 's' : ''})`;
  }
}

function renderEmptyPreview() {
  const printArea   = document.getElementById('print-area');
  const indicatorEl = document.getElementById('preview-page-indicator');
  if (printArea) {
    printArea.innerHTML = `
      <div class="preview-placeholder" id="preview-placeholder">
        <div class="placeholder-icon">📄</div>
        <h3>No Preview Generated Yet</h3>
        <p>Add recipient addresses on the left, then click <strong>Generate Preview</strong> to see the A4 slips.</p>
      </div>
    `;
  }
  if (indicatorEl) {
    indicatorEl.textContent = '0 Pages';
  }
}

/* ══════════════════════════════════════════════════════
   PREVIEW TRIGGER
   ══════════════════════════════════════════════════════ */
function handleGeneratePreview() {
  if (recipients.length === 0) {
    return alert('Please add at least one recipient address before generating a preview.');
  }
  buildPrintPages();
  const scrollContainer = document.getElementById('preview-scroll-container');
  if (scrollContainer) {
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/* ══════════════════════════════════════════════════════
   PRINT & PDF EXPORT
   ══════════════════════════════════════════════════════ */
function doPrint() {
  if (recipients.length === 0) {
    return alert('Please add at least one recipient before printing.');
  }
  buildPrintPages();
  setTimeout(() => {
    window.print();
  }, 200);
}

/* ══════════════════════════════════════════════════════
   WORD (.docx) EXPORT
   ══════════════════════════════════════════════════════ */
function downloadDocx() {
  if (recipients.length === 0) {
    return alert('Please add at least one recipient before downloading.');
  }

  if (typeof docx === 'undefined') {
    return alert('Word export library is still loading. Please check your internet connection and try again in a moment.');
  }

  const {
    Document, Packer, Paragraph, Table, TableRow, TableCell,
    TextRun, WidthType, BorderStyle, HeightRule, PageBreak, VerticalAlign
  } = docx;

  const A4_WIDTH_DXA  = 11906; // A4 portrait width in twips (210mm)
  const MARGIN_DXA    = 1000;  // Page margin
  const CONTENT_WIDTH = A4_WIDTH_DXA - (2 * MARGIN_DXA);
  const HALF_WIDTH    = Math.floor(CONTENT_WIDTH / 2);

  const BORDER    = { style: BorderStyle.SINGLE, size: 8, color: '222222' };
  const DIVIDER   = { style: BorderStyle.SINGLE, size: 8, color: '222222' };
  const NO_BORDER = { style: BorderStyle.NIL };

  const bold = (text, sz = 20) => new TextRun({ text, bold: true, size: sz, font: 'Calibri' });
  const reg  = (text, sz = 19) => new TextRun({ text, size: sz, font: 'Calibri' });

  function makeSlipTable(recipient) {
    const fromParas = [
      new Paragraph({ children: [bold('FROM', 18)], spacing: { after: 50 } }),
      new Paragraph({ children: [bold(fromAddress.business, 22)], spacing: { after: 30 } }),
      new Paragraph({ children: [reg(fromAddress.contact, 19)], spacing: { after: 20 } }),
      new Paragraph({ children: [reg(fromAddress.address, 19)], spacing: { after: 20 } }),
      new Paragraph({ children: [bold('Mobile: ' + fromAddress.mobile, 19)] }),
    ];

    const toParas = recipient ? [
      new Paragraph({ children: [bold('TO', 18)], spacing: { after: 50 } }),
      new Paragraph({ children: [bold(recipient.name, 23)], spacing: { after: 30 } }),
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
          height: { value: 1600, rule: HeightRule.ATLEAST },
          children: [
            new TableCell({
              width: { size: HALF_WIDTH, type: WidthType.DXA },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 80, bottom: 80, left: 140, right: 140 },
              children: fromParas,
            }),
            new TableCell({
              width: { size: HALF_WIDTH, type: WidthType.DXA },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 80, bottom: 80, left: 140, right: 140 },
              children: toParas,
            }),
          ]
        })
      ]
    });
  }

  const spacer = () => new Paragraph({ text: '', spacing: { after: 50 } });

  const sections = [];
  const totalPages = Math.ceil(recipients.length / SLIPS_PER_PAGE);

  for (let p = 0; p < totalPages; p++) {
    const pageChildren = [];

    // Exactly 4 slips per page
    for (let s = 0; s < SLIPS_PER_PAGE; s++) {
      const globalIdx = p * SLIPS_PER_PAGE + s;
      const recipient = globalIdx < recipients.length ? recipients[globalIdx] : null;

      pageChildren.push(makeSlipTable(recipient));
      if (s < SLIPS_PER_PAGE - 1) {
        pageChildren.push(spacer());
      }
    }

    // Page break after every page except the last
    if (p < totalPages - 1) {
      pageChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }

    sections.push(...pageChildren);
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: A4_WIDTH_DXA, height: 16838 }, // A4 Portrait (210mm x 297mm)
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
    console.error('DOCX export error:', err);
    alert('Word document export failed. Please check the browser console for details.');
  });
}

/* ══════════════════════════════════════════════════════
   UTILITY HELPERS
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
   PREVIEW ZOOM CONTROLS
   ══════════════════════════════════════════════════════ */
let zoomLevel = 1.0;
const MIN_ZOOM = 0.7;
const MAX_ZOOM = 1.4;
const ZOOM_STEP = 0.1;

function applyZoom(level) {
  zoomLevel = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(level * 10) / 10));
  const printArea = document.getElementById('print-area');
  const zoomLabel = document.getElementById('zoom-level-label');
  if (printArea) {
    printArea.style.transform = `scale(${zoomLevel})`;
    printArea.style.transformOrigin = 'top center';
  }
  if (zoomLabel) {
    zoomLabel.textContent = `${Math.round(zoomLevel * 100)}%`;
  }
}

/* ══════════════════════════════════════════════════════
   EVENT WIRING ON DOM READY
   ══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  // ── A. FROM Address controls ──
  document.getElementById('btn-edit-from').addEventListener('click', openFromEdit);
  document.getElementById('btn-save-from').addEventListener('click', saveFromEdit);
  document.getElementById('btn-cancel-from').addEventListener('click', closeFromEdit);
  document.getElementById('btn-reset-from').addEventListener('click', resetFromAddress);

  ['from-business','from-contact','from-address','from-mobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => clearError(document.getElementById('from-error')));
  });

  // ── B. Add Recipient controls & Keyboard Navigation ──
  document.getElementById('btn-add').addEventListener('click', addRecipient);

  const toNameAddress = document.getElementById('to-name-address');
  const toMobile      = document.getElementById('to-mobile');

  if (toNameAddress) {
    toNameAddress.addEventListener('input', () => clearError(document.getElementById('add-error')));
    toNameAddress.addEventListener('keydown', e => {
      // Allow Ctrl+Enter or Cmd+Enter to submit directly from the textarea
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        addRecipient();
      }
    });
  }

  if (toMobile) {
    toMobile.addEventListener('input', () => clearError(document.getElementById('add-error')));
    toMobile.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addRecipient();
      }
    });
  }

  // ── C. Search in Recipient Directory ──
  const searchInput = document.getElementById('recipient-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => renderRecipientTable());
  }

  // ── D. Zoom Controls for Preview ──
  const btnZoomIn    = document.getElementById('btn-zoom-in');
  const btnZoomOut   = document.getElementById('btn-zoom-out');
  const btnZoomReset = document.getElementById('btn-zoom-reset');

  if (btnZoomIn)    btnZoomIn.addEventListener('click', () => applyZoom(zoomLevel + ZOOM_STEP));
  if (btnZoomOut)   btnZoomOut.addEventListener('click', () => applyZoom(zoomLevel - ZOOM_STEP));
  if (btnZoomReset) btnZoomReset.addEventListener('click', () => applyZoom(1.0));

  // ── E. Edit Modal controls ──
  document.getElementById('btn-save-edit').addEventListener('click', saveEditModal);
  document.getElementById('btn-cancel-edit').addEventListener('click', closeEditModal);

  const btnCloseModal = document.getElementById('btn-close-modal');
  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', closeEditModal);
  }

  const editModal = document.getElementById('edit-modal');
  if (editModal) {
    editModal.addEventListener('click', e => {
      if (e.target === editModal) closeEditModal();
    });
  }

  ['edit-name','edit-mobile','edit-address'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => clearError(document.getElementById('edit-error')));
  });

  // ── F. Actions Card buttons (Right Column) ──
  document.getElementById('btn-preview').addEventListener('click', handleGeneratePreview);
  document.getElementById('btn-print').addEventListener('click', doPrint);
  document.getElementById('btn-pdf').addEventListener('click', doPrint);
  document.getElementById('btn-docx').addEventListener('click', downloadDocx);
  document.getElementById('btn-clear').addEventListener('click', clearAllRecipients);

  // ── Initial Render ──
  renderFromDisplay();
  renderRecipientTable();

  // Auto-focus first input field for rapid workflow
  if (toNameAddress) toNameAddress.focus();
});
