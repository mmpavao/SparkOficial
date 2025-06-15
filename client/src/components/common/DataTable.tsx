import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "./StatusBadge";

import { useTranslation } from '@/contexts/I18nContext';
interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
}

interface Action<T> {
  label: string;
  onClick: (item: T) => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  condition?: (item: T) => boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({ 
  data, 
  columns, 
  actions = [],
  emptyMessage = "Nenhum dado encontrado"
}: DataTableProps<T>) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={String(column.key)}>
              {column.label}
            </TableHead>
          ))}
          {actions.length > 0 && <TableHead>{t.common.acoes}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => (
          <TableRow key={item.id || index}>
            {columns.map((column) => {
              const value = item[column.key];
              return (
                <TableCell key={String(column.key)}>
                  {column.render ? column.render(value, item) : value}
                </TableCell>
              );
            })}
            {actions.length > 0 && (
              <TableCell>
                <div className="flex gap-2">
                  {actions
                    .filter(action => !action.condition || action.condition(item))
                    .map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        size="sm"
                        variant={action.variant || "outline"}
                        onClick={() => action.onClick(item)}
                      >
                        {action.label}
                      </Button>
                    ))}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}