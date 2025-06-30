import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, CreditCard, Receipt, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface ImportCostCalculatorProps {
  totalValue: number;
  creditApplication?: {
    adminFee: number;
    finalCreditLimit: number;
    finalApprovedTerms: string[];
    finalDownPayment: number;
  };
}

export function ImportCostCalculator({ totalValue, creditApplication }: ImportCostCalculatorProps) {
  if (!creditApplication || totalValue <= 0) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Preencha o valor total para ver o cálculo dos custos
          </p>
        </CardContent>
      </Card>
    );
  }

  // Cálculos baseados no crédito aprovado
  const adminFeeRate = creditApplication.adminFee / 100; // Converte para decimal
  const downPaymentRate = creditApplication.finalDownPayment / 100; // 30% = 0.30
  
  // Cálculo da entrada (sobre valor FOB)
  const downPayment = totalValue * downPaymentRate;
  
  // Valor a ser financiado (valor FOB - entrada)
  const financedAmount = totalValue - downPayment;
  
  // Taxa administrativa (apenas sobre valor financiado)
  const adminFeeAmount = financedAmount * adminFeeRate;
  
  // Valor total da importação (FOB + Taxa Admin)
  const totalImportValue = totalValue + adminFeeAmount;
  
  // Número de parcelas baseado nos termos aprovados
  const installmentTerms = creditApplication.finalApprovedTerms.length;
  const installmentValue = installmentTerms > 0 ? financedAmount / installmentTerms : 0;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
          <Calculator className="h-5 w-5" />
          Resumo Financeiro da Importação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Valor FOB */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Valor FOB:</span>
          <span className="font-semibold">{formatCurrency(totalValue, 'USD')}</span>
        </div>

        {/* Entrada a pagar */}
        <div className="flex justify-between items-center p-3 bg-yellow-100 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              Entrada ({creditApplication.finalDownPayment}%):
            </span>
          </div>
          <span className="font-bold text-lg text-yellow-800">
            {formatCurrency(downPayment, 'USD')}
          </span>
        </div>

        <Separator />

        {/* Valor financiado */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Valor Financiado:</span>
          <span className="font-semibold">{formatCurrency(financedAmount, 'USD')}</span>
        </div>

        {/* Taxa administrativa */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">
            Taxa Admin ({creditApplication.adminFee}%):
          </span>
          <span className="font-semibold text-red-600">
            {formatCurrency(adminFeeAmount, 'USD')}
          </span>
        </div>

        {/* Parcelas */}
        {installmentTerms > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              Parcelas ({installmentTerms}x):
            </span>
            <span className="font-semibold">
              {formatCurrency(installmentValue, 'USD')}
            </span>
          </div>
        )}

        <Separator />

        {/* Valor total */}
        <div className="flex justify-between items-center p-3 bg-blue-100 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">Valor Total:</span>
          </div>
          <span className="font-bold text-lg text-blue-800">
            {formatCurrency(totalImportValue, 'USD')}
          </span>
        </div>

        {/* Termos de pagamento */}
        {creditApplication.finalApprovedTerms.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Termos aprovados:</p>
            <div className="flex flex-wrap gap-1">
              {creditApplication.finalApprovedTerms.map((term) => (
                <Badge key={term} variant="secondary" className="text-xs">
                  {term} dias
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Resumo de pagamento */}
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs font-medium text-green-800 mb-1">💰 Para iniciar:</p>
          <p className="text-sm text-green-700">
            Pague {formatCurrency(downPayment, 'USD')} de entrada
          </p>
          <p className="text-xs text-green-600 mt-1">
            + {installmentTerms} parcelas de {formatCurrency(installmentValue, 'USD')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}