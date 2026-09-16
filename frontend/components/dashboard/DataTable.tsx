'use client';

import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Hidden on small screens where horizontal space is scarce. */
  hideOnMobile?: boolean;
}

/**
 * A table on wide screens, stacked cards on phones — the dashboard lists are the
 * densest screens in the app and a plain table is unreadable at 375px.
 */
export const DataTable = <T,>({
  columns,
  rows,
  rowKey,
  actions,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  actions?: (row: T) => ReactNode;
}) => (
  <>
    <div className="hidden overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200/70 md:block">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50/80">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {column.header}
              </th>
            ))}
            {actions && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="transition hover:bg-slate-50/60">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 text-slate-700">
                  {column.render(row)}
                </td>
              ))}
              {actions && <td className="px-4 py-3 text-right">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="space-y-3 md:hidden">
      {rows.map((row) => (
        <div key={rowKey(row)} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
          <dl className="space-y-2">
            {columns
              .filter((column) => !column.hideOnMobile)
              .map((column) => (
                <div key={column.key} className="flex items-start justify-between gap-3">
                  <dt className="text-xs uppercase tracking-wide text-slate-400">{column.header}</dt>
                  <dd className="text-right text-sm text-slate-700">{column.render(row)}</dd>
                </div>
              ))}
          </dl>
          {actions && <div className="mt-3 flex flex-wrap justify-end gap-2">{actions(row)}</div>}
        </div>
      ))}
    </div>
  </>
);
