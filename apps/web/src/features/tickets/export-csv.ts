import type { Row, Table } from '@tanstack/react-table';

// Spreadsheet apps run cells that start like a formula. Values beginning with
// = @ tab or CR — or + / - followed by something other than a digit (so phone
// numbers like "+254 …" and negative amounts stay untouched) — get a leading
// apostrophe so they open as plain text.
const FORMULA_START = /^(?:[=@\t\r]|[+-](?![\d\s]))/;

function toCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  let text = String(value);
  if (FORMULA_START.test(text)) {
    text = `'${text}`;
  }
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Downloads rows as a CSV file — every data column, including hidden ones (the
 * Tickets table folds phone, route and ref into other columns but they still
 * belong in the file). The checkbox column holds no data, so it's skipped.
 *
 * `rows` defaults to what the table is showing right now, after filters and
 * sorting; pass a subset (e.g. the selected rows) to export just those.
 */
export function exportTableToCsv<TData>(
  table: Table<TData>,
  fileName: string,
  rows: Row<TData>[] = table.getRowModel().rows,
) {
  const columns = table
    .getAllLeafColumns()
    .filter((column) => typeof column.accessorFn !== 'undefined');

  const header = columns.map((column) => toCsvCell(column.columnDef.meta?.label ?? column.id));
  const body = rows.map((row) => columns.map((column) => toCsvCell(row.getValue(column.id))));

  const csv = [header, ...body].map((cells) => cells.join(',')).join('\r\n');
  // The byte-order mark makes Excel read the file as UTF-8 (e.g. the → in routes).
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
