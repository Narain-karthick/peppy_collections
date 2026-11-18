# Peppy Collections – Courier Slip Generator

A clean, responsive, offline-ready web app for generating A4 courier address slips with **3 slips per page** in a balanced two-column dashboard layout.

---

## 📁 Project Structure

```
ShipmentPrint/
├── index.html   – Main page (Two-column dashboard: Left 40% entry, Right 60% preview/actions)
├── style.css    – All styles (screen + print media, responsive breakpoints)
├── script.js    – All logic (strict 3-slip pagination, localStorage, docx.js export)
└── README.md    – Documentation & usage guide
```

---

## 🖥️ Layout & Dashboard

- **LEFT COLUMN (40% width):** Entry Section
  1. **Default FROM Address** – Pre-filled sender details, Edit mode with validation, Save to `localStorage`, Reset option.
  2. **Add Recipient Address** – Recipient Name, Mobile Number (10 digits), Address, and Add Address button.
  3. **Recipient List** – Table with serial numbers, recipient details, inline Edit & Delete actions, and recipient count badge.

- **RIGHT COLUMN (60% width):** Preview & Actions
  1. **Actions Toolbar** – Generate Preview, Print, Download PDF, Download Word (.docx), and Clear All.
  2. **Courier Slip Preview** – Interactive A4 portrait pages with page indicators (`Page X of Y`), scrollable multi-page view, and strictly 3 slips per page.

- **Responsive Design:** On tablets and mobile screens (width ≤ 1024px), the layout automatically stacks into a single column with entry controls first and the preview second.

---

## 📄 Strict Pagination (3 Slips per A4 Page)

Pagination follows the rule:
`pageIndex = Math.floor(index / 3)` and `slipIndex = index % 3`

| Recipients | Total Pages | Slips on Last Page |
|---|---|---|
| 1 to 3 | 1 Page | 1 to 3 slips |
| 4 to 6 | 2 Pages | 1 to 3 slips (Slip 4 starts Page 2) |
| 7 to 9 | 3 Pages | 1 to 3 slips (Slip 7 starts Page 3) |
| 10 | 4 Pages | 1 slip (Slip 10 starts Page 4) |

- Slips are never split across pages.
- Unused slip slots on the final page are kept blank in print to prevent ink waste while preserving exact layout proportions.

---

## 🚀 How to Run (VS Code Live Server)

1. Open VS Code.
2. Open the `ShipmentPrint` folder: **File → Open Folder**.
3. Install the **Live Server** extension (Ritwick Dey) if not already installed.
4. Right-click `index.html` in the Explorer panel.
5. Select **"Open with Live Server"**.
6. Your browser will open at `http://127.0.0.1:5500/index.html`.

---

## 🖨️ Printing & PDF Export

- Format: **A4 Portrait**
- In the print dialog, set Margins to **Default** or **Minimum**.
- Uncheck **"Headers and Footers"** in your browser's print options for a clean document.
- Choose **"Save as PDF"** for PDF export.

---

## 📝 Word Document (.docx) Export

The Word document is generated using client-side `docx.js`:
- Real editable tables with borders and dividing line.
- Equal-width FROM (left) and TO (right) columns.
- Exact 3 slips per A4 page with page breaks.
