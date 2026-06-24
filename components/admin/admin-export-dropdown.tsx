"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {Download, FileText, Printer, Table2} from "lucide-react";

export type ExportValue = string | number | boolean | null | undefined;

export interface ExportColumn<T> {
  header: string;
  getValue: (row: T) => ExportValue;
}

interface AdminExportDropdownProps<T> {
  labels: Record<string, string>;
  rows: T[];
  columns: ExportColumn<T>[];
  filename: string;
  title: string;
}

const MENU_WIDTH = 184;

function textValue(value: ExportValue) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function safeSpreadsheetValue(value: ExportValue) {
  const text = textValue(value);
  return /^[=+\-@]/.test(text.trim()) ? `'${text}` : text;
}

function csvCell(value: ExportValue) {
  const text = safeSpreadsheetValue(value).replace(/"/g, '""');
  return `"${text}"`;
}

function htmlCell(value: ExportValue) {
  return textValue(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function AdminExportDropdown<T>({
  labels,
  rows,
  columns,
  filename,
  title,
}: AdminExportDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({top: 0, left: 0});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const left = Math.min(Math.max(8, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8);
    setPosition({top: rect.bottom + 8, left});
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  const closeAfter = (action: () => void) => {
    action();
    setOpen(false);
  };

  const exportCSV = () => {
    const header = columns.map((column) => csvCell(column.header)).join(",");
    const body = rows.map((row) => columns.map((column) => csvCell(column.getValue(row))).join(",")).join("\n");
    downloadText(`${filename}-${dateStamp()}.csv`, `\uFEFF${header}\n${body}`, "text/csv;charset=utf-8");
  };

  const exportExcel = () => {
    const header = columns.map((column) => safeSpreadsheetValue(column.header)).join("\t");
    const body = rows.map((row) => columns.map((column) => safeSpreadsheetValue(column.getValue(row))).join("\t")).join("\n");
    downloadText(`${filename}-${dateStamp()}.xls`, `\uFEFF${header}\n${body}`, "application/vnd.ms-excel;charset=utf-8");
  };

  const exportPDF = () => {
    const tableHeader = columns.map((column) => `<th>${htmlCell(column.header)}</th>`).join("");
    const tableRows = rows.map((row) => (
      `<tr>${columns.map((column) => `<td>${htmlCell(column.getValue(row))}</td>`).join("")}</tr>`
    )).join("");
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${htmlCell(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
    h1 { font-size: 22px; margin: 0 0 16px; }
    table { border-collapse: collapse; width: 100%; font-size: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: start; vertical-align: top; }
    th { background: #f9fafb; font-weight: 700; }
  </style>
</head>
<body>
  <h1>${htmlCell(title)}</h1>
  <table><thead><tr>${tableHeader}</tr></thead><tbody>${tableRows}</tbody></table>
</body>
</html>`;
    const printWindow = window.open("", "_blank", "width=1024,height=768");
    if (!printWindow) {
      downloadText(`${filename}-${dateStamp()}.html`, html, "text/html;charset=utf-8");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 250);
  };

  const menu = mounted && open ? createPortal(
    <div
      ref={menuRef}
      className="fixed z-[100] w-46 rounded-2xl border border-border/60 bg-card p-2 text-foreground shadow-2xl shadow-black/15"
      style={{top: position.top, left: position.left, width: MENU_WIDTH}}
    >
      <button type="button" onClick={() => closeAfter(exportCSV)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-muted/50">
        <FileText size={15} />
        {labels.exportCSV ?? "Export CSV"}
      </button>
      <button type="button" onClick={() => closeAfter(exportExcel)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-muted/50">
        <Table2 size={15} />
        {labels.exportExcel ?? "Export Excel"}
      </button>
      <button type="button" onClick={() => closeAfter(exportPDF)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-muted/50">
        <Printer size={15} />
        {labels.exportPDF ?? "Export PDF"}
      </button>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          updatePosition();
          setOpen((current) => !current);
        }}
        className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-muted/50"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Download size={15} />
        {labels.exportCSV ?? "Export"}
      </button>
      {menu}
    </>
  );
}
