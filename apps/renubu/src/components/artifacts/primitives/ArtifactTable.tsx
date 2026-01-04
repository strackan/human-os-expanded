/**
 * ArtifactTable - Typed table with consistent styling
 *
 * Provides:
 * - Generic typed columns and data
 * - Consistent header/row styling
 * - Optional row click handling
 * - Zebra striping option
 * - Compact/comfortable density
 */

import React from 'react';

export interface TableColumn<T> {
  /** Unique key for the column */
  key: string;
  /** Column header text */
  header: string;
  /** Width class (e.g., 'w-1/3', 'w-24') */
  width?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Render function for cell content */
  render?: (row: T, index: number) => React.ReactNode;
  /** Accessor for simple value display */
  accessor?: keyof T;
}

export interface ArtifactTableProps<T> {
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Data rows */
  data: T[];
  /** Row key accessor */
  getRowKey?: (row: T, index: number) => string | number;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Enable zebra striping */
  striped?: boolean;
  /** Table density */
  density?: 'compact' | 'comfortable';
  /** Additional CSS classes */
  className?: string;
  /** Debug section ID */
  sectionId?: string;
  /** Empty state message */
  emptyMessage?: string;
}

const ALIGN_CLASSES = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const DENSITY_CLASSES = {
  compact: {
    header: 'px-3 py-2',
    cell: 'px-3 py-2',
  },
  comfortable: {
    header: 'px-4 py-3',
    cell: 'px-4 py-3',
  },
};

export function ArtifactTable<T>({
  columns,
  data,
  getRowKey = (_, index) => index,
  onRowClick,
  striped = false,
  density = 'comfortable',
  className = '',
  sectionId,
  emptyMessage = 'No data available',
}: ArtifactTableProps<T>) {
  const densityStyles = DENSITY_CLASSES[density];

  const getCellContent = (column: TableColumn<T>, row: T, index: number): React.ReactNode => {
    if (column.render) {
      return column.render(row, index);
    }
    if (column.accessor) {
      const value = row[column.accessor];
      return value !== null && value !== undefined ? String(value) : '';
    }
    return '';
  };

  if (data.length === 0) {
    return (
      <div
        id={sectionId}
        className={`text-center py-8 text-gray-500 ${className}`}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div id={sectionId} className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`
                  ${densityStyles.header}
                  ${ALIGN_CLASSES[column.align || 'left']}
                  ${column.width || ''}
                  text-xs font-semibold text-gray-600 uppercase tracking-wide
                `}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={getRowKey(row, rowIndex)}
              onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
              className={`
                border-b border-gray-100 last:border-b-0
                ${striped && rowIndex % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                ${onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
              `}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`
                    ${densityStyles.cell}
                    ${ALIGN_CLASSES[column.align || 'left']}
                    ${column.width || ''}
                    text-sm text-gray-700
                  `}
                >
                  {getCellContent(column, row, rowIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

ArtifactTable.displayName = 'ArtifactTable';
export default ArtifactTable;
