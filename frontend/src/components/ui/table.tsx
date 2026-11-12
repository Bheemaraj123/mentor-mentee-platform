import React from "react";

export const Table = ({
  children,
  className = "",
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) => (
  <div className="relative w-full overflow-auto">
    <table
      className={`w-full caption-bottom text-sm ${className}`}
      {...props}
    >
      {children}
    </table>
  </div>
);

export const TableHeader = ({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={`border-b ${className}`} {...props}>
    {children}
  </thead>
);

export const TableBody = ({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={className} {...props}>
    {children}
  </tbody>
);

export const TableRow = ({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={`border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${className}`}
    {...props}
  >
    {children}
  </tr>
);

export const TableCell = ({
  children,
  className = "",
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={`p-3 align-middle ${className}`} {...props}>
    {children}
  </td>
);