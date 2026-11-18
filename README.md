# Peppy Collections – Courier Slip Generator

A clean, responsive, offline-ready web app for generating A4 courier address slips with **3 slips per page**.

---

## 📁 Project Structure

```
ShipmentPrint/
├── index.html   – Main page (UI + print layout)
├── style.css    – All styles (screen + print media)
├── script.js    – All logic (no frameworks)
└── README.md    – This file
```

---

## 🚀 How to Run (VS Code Live Server)

1. Open VS Code.
2. Open the `ShipmentPrint` folder: **File → Open Folder**.
3. Install the **Live Server** extension (if not already installed):
   - Click the Extensions icon (or press `Ctrl+Shift+X`).
   - Search for **Live Server** by Ritwick Dey.
   - Click **Install**.
4. Right-click `index.html` in the Explorer panel.
5. Select **"Open with Live Server"**.
6. Your browser will open at `http://127.0.0.1:5500/index.html`.

> **Note:** An internet connection is required the first time to load the Word export library (docx.js) from CDN. After that the browser caches it.

---

## ✨ Features

| Feature | Detail |
|---|---|
| Default FROM address | Pre-filled; saved in `localStorage` |
| Edit FROM address | Full editable form with validation |
| Reset to default | One-click restore |
| Add recipients | Name, Address, Mobile with validation |
| Recipient list | Sortable table with Edit & Delete |
| Generate Preview | A4 pages rendered in-browser |
| 3 slips per A4 page | Automatic page breaks |
| Print | Hides UI; prints only slips |
| Download PDF | Via browser's print-to-PDF |
| Download Word (.docx) | Real editable DOCX (docx.js library) |
| Clear All | Confirmation-guarded bulk delete |
| Persistent storage | Recipients saved across page refreshes |

---

## 🖨️ Printing Tips

- Choose **A4 paper size** in the print dialog.
- Set **margins to None** (or Minimum) for best fit.
- Disable **"Print headers and footers"** if your browser adds them.
- Choose **"Save as PDF"** as the destination for PDF export.

---

## 📝 Word Export Notes

The **.docx** file is generated entirely in the browser using the [docx.js](https://docx.js.org/) library.  
It contains real editable text in a two-column table layout (FROM | TO), three slips per page, with borders.  
Open the file in Microsoft Word or LibreOffice Writer to edit if needed.

---

## 📱 Mobile Number Validation

The app validates Indian mobile numbers:
- Must be exactly **10 digits**.
- Must start with **6, 7, 8, or 9**.

---

## 🛠️ Tech Stack

- HTML5
- CSS3 (including `@media print`)
- Vanilla JavaScript (ES6+)
- [docx.js v8](https://docx.js.org/) via CDN (Word export)
- `localStorage` (persistent sender address & recipient list)

---

*Developed for Peppy Collections, 2026.*
