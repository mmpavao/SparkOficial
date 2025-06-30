import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, CreditCard, Receipt, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface ImportFinancialSummaryProps {
  importData: {
    totalValue: string;
    creditApplicationId?: number;
  };
  creditApplication?: {
    adminFee: number;
    finalCreditLimit: number;
    finalApprovedTerms: string;
    finalDownPayment: number;
  };
}

export function ImportFinancialSummary({ importData, creditApplication }: ImportFinancialSummaryProps) {
  const totalValue = parseFloat(importData.totalValue) || 0;

  if (!creditApplication || totalValue <= 0) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
            <AlertCircle className="h-5 w-5" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-700">
            Dados de crédito não disponíveis para esta importação
          </p>
        </CardContent>
      </Card>
    );
  }

  // Cálculos financeiros
  const adminFeeRate = creditApplication.adminFee / 100;
  const downPaymentRate = creditApplication.finalDownPayment / 100;
  
  const downPayment = totalValue * downPaymentRate;
  const financedAmount = totalValue - downPayment;
  const adminFeeAmount = financedAmount * adminFeeRate;
  const totalImportValue = totalValue + adminFeeAmount;
  
  // Parse finalApprovedTerms from comma-separated string
  const approvedTerms = creditApplication.finalApprovedTerms 
    ? creditApplication.finalApprovedTerms.split(',').map(term => term.trim())
    : [];
  
  const installmentTerms = approvedTerms.length;
  const installmentValue = installmentTerms > 0 ? financedAmount / installmentTerms : 0;

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2 text-blue-800">
          <TrendingUp className="h-6 w-6" />
          Análise Financeira da Importação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seção: Valores Base */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
            Valores Base
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
              <span className="text-sm font-medium">Valor FOB:</span>
              <span className="font-bold text-lg">{formatCurrency(totalValue, 'USD')}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
              <span className="text-sm font-medium text-red-700">
                Taxa Admin ({creditApplication.adminFee}%):
              </span>
              <span className="font-bold text-lg text-red-700">
                {formatCurrency(adminFeeAmount, 'USD')}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Seção: Pagamento Imediato */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
            💰 Para Iniciar a Importação
          </h4>
          
          <div className="p-4 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg border border-yellow-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-800">
                    Entrada ({creditApplication.finalDownPayment}%)
                  </p>
                  <p className="text-xs text-yellow-700">
                    Pagamento obrigatório para iniciar
                  </p>
                </div>
              </div>
              <span className="font-bold text-2xl text-yellow-800">
                {formatCurrency(downPayment, 'USD')}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Seção: Financiamento */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
            Valor Financiado
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
              <span className="text-sm font-medium">Valor Financiado:</span>
              <span className="font-semibold">{formatCurrency(financedAmount, 'USD')}</span>
            </div>
            
            {installmentTerms > 0 && (
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm font-medium text-green-700">
                  Parcelas ({installmentTerms}x):
                </span>
                <span className="font-semibold text-green-700">
                  {formatCurrency(installmentValue, 'USD')}
                </span>
              </div>
            )}
          </div>
          
          {/* Termos de pagamento */}
          {approvedTerms.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">Prazos aprovados:</p>
              <div className="flex flex-wrap gap-2">
                {approvedTerms.map((term) => (
                  <Badge key={term} variant="outline" className="text-xs bg-blue-50">
                    {term} dias
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Seção: Total Final */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
            Valor Total da Operação
          </h4>
          
          <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border border-blue-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-800">
                    Custo Total (FOB + Taxas)
                  </p>
                  <p className="text-xs text-blue-700">
                    Valor final incluindo todas as taxas
                  </p>
                </div>
              </div>
              <span className="font-bold text-2xl text-blue-800">
                {formatCurrency(totalImportValue, 'USD')}
              </span>
            </div>
          </div>
        </div>

        {/* Resumo de fluxo de caixa */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h5 className="font-medium text-sm text-gray-700 mb-3">💡 Resumo do Fluxo de Caixa:</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>• Pagamento inicial (entrada):</span>
              <span className="font-semibold">{formatCurrency(downPayment, 'USD')}</span>
            </div>
            <div className="flex justify-between">
              <span>• Total em parcelas:</span>
              <span className="font-semibold">{formatCurrency(financedAmount, 'USD')}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total da importação:</span>
              <span>{formatCurrency(totalImportValue, 'USD')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}