import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Users, CreditCard, FileText, Package, ShoppingCart, Settings } from 'lucide-react';

interface DatabaseStats {
  totalUsers: number;
  totalCreditApplications: number;
  totalImports: number;
  totalSuppliers: number;
  totalPayments: number;
  databaseSize: string;
}

interface TableData {
  name: string;
  icon: React.ReactNode;
  data: any[];
  columns: string[];
}

export default function DatabaseViewer() {
  const [selectedTable, setSelectedTable] = useState('users');

  const { data: stats, isLoading: statsLoading } = useQuery<DatabaseStats>({
    queryKey: ['/api/database/stats'],
  });

  const { data: tableData, isLoading: tableLoading } = useQuery<any[]>({
    queryKey: ['/api/database/table', selectedTable],
  });

  const tables: TableData[] = [
    {
      name: 'users',
      icon: <Users className="w-4 h-4" />,
      data: tableData || [],
      columns: ['id', 'fullName', 'email', 'companyName', 'cnpj', 'role', 'status']
    },
    {
      name: 'credit_applications',
      icon: <CreditCard className="w-4 h-4" />,
      data: tableData || [],
      columns: ['id', 'userId', 'requestedAmount', 'status', 'financial_status', 'adminStatus']
    },
    {
      name: 'imports',
      icon: <Package className="w-4 h-4" />,
      data: tableData || [],
      columns: ['id', 'userId', 'name', 'status', 'totalValue', 'cargoType']
    },
    {
      name: 'suppliers',
      icon: <ShoppingCart className="w-4 h-4" />,
      data: tableData || [],
      columns: ['id', 'companyName', 'email', 'phone', 'city', 'province']
    },
    {
      name: 'payment_schedules',
      icon: <FileText className="w-4 h-4" />,
      data: tableData || [],
      columns: ['id', 'importId', 'paymentType', 'amount', 'dueDate', 'status']
    }
  ];

  const currentTable = tables.find(t => t.name === selectedTable);

  const formatValue = (value: any, key: string) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (key.includes('Date') || key.includes('At')) {
      return new Date(value).toLocaleDateString('pt-BR');
    }
    if (key.includes('Amount') || key.includes('Value')) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'USD'
      }).format(parseFloat(value) || 0);
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Visualizador de Banco de Dados SQLite</h1>
          </div>
          <p className="text-gray-600">
            Interface visual para gerenciar os dados do sistema Spark Comex
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {statsLoading ? '...' : stats?.totalUsers || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Aplicações de Crédito</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statsLoading ? '...' : stats?.totalCreditApplications || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Importações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {statsLoading ? '...' : stats?.totalImports || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Fornecedores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {statsLoading ? '...' : stats?.totalSuppliers || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabelas */}
        <Card>
          <CardHeader>
            <CardTitle>Dados das Tabelas</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTable} onValueChange={setSelectedTable}>
              <TabsList className="grid w-full grid-cols-5">
                {tables.map((table) => (
                  <TabsTrigger key={table.name} value={table.name} className="flex items-center gap-2">
                    {table.icon}
                    <span className="hidden sm:inline">{table.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {tables.map((table) => (
                <TabsContent key={table.name} value={table.name} className="mt-4">
                  <div className="mb-4">
                    <Badge variant="outline" className="mb-2">
                      {table.data.length} registros
                    </Badge>
                  </div>

                  <ScrollArea className="h-[600px] w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {table.columns.map((column) => (
                            <TableHead key={column} className="font-semibold">
                              {column}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableLoading ? (
                          <TableRow>
                            <TableCell colSpan={table.columns.length} className="text-center py-8">
                              Carregando dados...
                            </TableCell>
                          </TableRow>
                        ) : table.data.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={table.columns.length} className="text-center py-8">
                              Nenhum registro encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          table.data.map((row, index) => (
                            <TableRow key={index}>
                              {table.columns.map((column) => (
                                <TableCell key={column} className="py-2">
                                  {formatValue(row[column], column)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}