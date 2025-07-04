import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calculator, DollarSign, TrendingUp, Calendar, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { apiRequest } from "@/lib/queryClient";

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

    const { data: userFinancialSettings } = useQuery({
        queryKey: ["userFinancialSettings"],
        queryFn: () => apiRequest<any>(`/api/user/financial-settings`),
        enabled: true,
        retry: false,
    });

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

  // Cálculos financeiros baseados nas configurações globais do usuário
  const adminFeePercent = userFinancialSettings?.adminFeePercentage || 0;
  const downPaymentPercent = userFinancialSettings?.downPaymentPercentage || 30;
  const approvedTerms = userFinancialSettings?.paymentTerms || "60,90,120";

  const downPayment = (totalValue * downPaymentPercent) / 100;
  const financedAmount = totalValue - downPayment;
  const adminFee = (financedAmount * adminFeePercent) / 100;
  const totalWithFees = totalValue + adminFee;

  const installmentTerms = approvedTerms.split(',').map(term => parseInt(term.trim()));
  const installmentAmount = financedAmount / installmentTerms.length;

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
                Taxa Admin ({adminFeePercent}%):
              </span>
              <span className="font-bold text-lg text-red-700">
                {formatCurrency(adminFee, 'USD')}
              </span>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-b my-4"></div>

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
                    Entrada ({downPaymentPercent}%)
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

        {/* Separator */}
        <div className="border-b my-4"></div>

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

            {installmentTerms.length > 0 && (
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm font-medium text-green-700">
                  Parcelas ({installmentTerms.length}x):
                </span>
                <span className="font-semibold text-green-700">
                  {formatCurrency(installmentAmount, 'USD')}
                </span>
              </div>
            )}
          </div>

          {/* Termos de pagamento */}
          {installmentTerms.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">Prazos aprovados:</p>
              <div className="flex flex-wrap gap-2">
                {installmentTerms.map((term) => (
                  <Badge key={term} variant="outline" className="text-xs bg-blue-50">
                    {term} dias
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="border-b my-4"></div>

        {/* Seção: Total Final */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
            Valor Total da Operação
          </h4>

          <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border border-blue-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calculator className="h-6 w-6 text-blue-600" />
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
                {formatCurrency(totalWithFees, 'USD')}
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
              <span>{formatCurrency(totalWithFees, 'USD')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}