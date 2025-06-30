import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Users, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function CsvImportPage() {
  const [csvData, setCsvData] = useState('');
  const [importType, setImportType] = useState<'users' | 'applications'>('users');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvData(text);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo CSV válido",
        variant: "destructive"
      });
    }
  };

  const parseCsvToJson = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }

    return data;
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, carregue um arquivo CSV primeiro",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const jsonData = parseCsvToJson(csvData);
      
      if (jsonData.length === 0) {
        throw new Error("CSV vazio ou formato inválido");
      }

      const endpoint = importType === 'users' 
        ? '/api/admin/bulk-import/users'
        : '/api/admin/bulk-import/credit-applications';
      
      const payload = importType === 'users' 
        ? { users: jsonData }
        : { applications: jsonData };

      const response = await apiRequest(endpoint, 'POST', payload);
      
      setResults(response);
      toast({
        title: "Importação Concluída",
        description: response.message,
        variant: "default"
      });

    } catch (error: any) {
      toast({
        title: "Erro na Importação",
        description: error.message || "Erro interno do servidor",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Importação de Dados CSV</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload do Arquivo CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Importação:</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="importType"
                    value="users"
                    checked={importType === 'users'}
                    onChange={(e) => setImportType(e.target.value as 'users')}
                    className="text-blue-600"
                  />
                  <Users className="w-4 h-4" />
                  Importadores
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="importType"
                    value="applications"
                    checked={importType === 'applications'}
                    onChange={(e) => setImportType(e.target.value as 'applications')}
                    className="text-blue-600"
                  />
                  <CreditCard className="w-4 h-4" />
                  Análises de Crédito
                </label>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Arquivo CSV:</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* CSV Preview */}
            {csvData && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Preview dos Dados:</label>
                <textarea
                  value={csvData.slice(0, 500) + (csvData.length > 500 ? '...' : '')}
                  readOnly
                  className="w-full h-32 p-2 border rounded-md bg-gray-50 text-xs"
                />
                <p className="text-xs text-gray-500">
                  {csvData.split('\n').filter(l => l.trim()).length - 1} registros detectados
                </p>
              </div>
            )}

            <Button 
              onClick={handleImport} 
              disabled={!csvData || isLoading}
              className="w-full"
            >
              {isLoading ? 'Importando...' : 'Iniciar Importação'}
            </Button>
          </CardContent>
        </Card>

        {/* Instructions Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Instruções
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                {importType === 'users' ? (
                  <>
                    <strong>Estrutura para Importadores:</strong><br/>
                    Campos obrigatórios: company_name, cnpj, full_name, phone, email, password<br/>
                    Campos opcionais: role (default: importer), status (default: active)
                  </>
                ) : (
                  <>
                    <strong>Estrutura para Análises de Crédito:</strong><br/>
                    Campos obrigatórios: user_id, legal_company_name, cnpj, address, city, state, requested_amount<br/>
                    Campos opcionais: status, risk_level, analysis_notes, etc.
                  </>
                )}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm font-medium">Exemplo de CSV para {importType === 'users' ? 'Importadores' : 'Análises de Crédito'}:</p>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                {importType === 'users' ? (
                  `company_name,cnpj,full_name,phone,email,password
"Empresa ABC LTDA","11.222.333/0001-81","João Silva","(11) 99999-9999","joao@abc.com","senha123"`
                ) : (
                  `user_id,legal_company_name,cnpj,address,city,state,requested_amount
1,"Empresa ABC LTDA","11.222.333/0001-81","Rua das Flores, 123","São Paulo","SP","150000"`
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Observações Importantes:</p>
              <ul className="text-xs space-y-1 text-gray-600">
                <li>• Arquivo deve estar em formato CSV com cabeçalhos</li>
                <li>• CNPJs devem ser válidos (verificação matemática)</li>
                <li>• Emails devem ser únicos no sistema</li>
                <li>• Valores monetários como string (ex: "150000")</li>
                <li>• Use aspas duplas para campos com vírgulas</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Resultados da Importação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  {results.message}
                </AlertDescription>
              </Alert>

              {results.results && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Success */}
                  {results.results.success > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-600 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Registros Criados ({results.results.success})
                      </h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {results.results.created.map((item: any, index: number) => (
                          <div key={index} className="text-xs bg-green-50 p-2 rounded">
                            ID: {item.id} - {item.companyName || item.email}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {results.results.errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-red-600 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Erros ({results.results.errors.length})
                      </h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {results.results.errors.map((error: any, index: number) => (
                          <div key={index} className="text-xs bg-red-50 p-2 rounded">
                            <strong>Linha {error.line}:</strong> {error.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}