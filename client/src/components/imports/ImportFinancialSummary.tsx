import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calculator, CreditCard, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface ImportFinancialSummaryProps {
  fobValue: number;
  adminFeePercentage: number;
  downPaymentPercentage: number;
  currency: string;
  incoterms?: string;
}

interface FinancialBreakdown {
  fobValue: number;
  downPayment: number;
  financedAmount: number;
  adminFee: number;
  totalImportCost: number;
  totalPayable: number;
}

export default function ImportFinancialSummary({ 
  fobValue, 
  adminFeePercentage = 10, 
  downPaymentPercentage = 30,
  currency = "USD",
  incoterms = "FOB"
}: ImportFinancialSummaryProps) {
  
  const calculateFinancialBreakdown = (): FinancialBreakdown => {
    const downPayment = fobValue * (downPaymentPercentage / 100);
    const financedAmount = fobValue - downPayment;
    const adminFee = financedAmount * (adminFeePercentage / 100);
    const totalImportCost = fobValue + adminFee;
    const totalPayable = downPayment + financedAmount + adminFee;

    return {
      fobValue,
      downPayment,
      financedAmount,
      adminFee,
      totalImportCost,
      totalPayable
    };
  };

  const breakdown = calculateFinancialBreakdown();

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Resumo Financeiro
          </CardTitle>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            {incoterms}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* FOB Value */}
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Valor FOB</span>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-blue-900">
              {formatCurrency(breakdown.fobValue, currency)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Valor base da mercadoria</div>
          </div>

          {/* Down Payment */}
          <div className="bg-white rounded-lg p-4 border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Entrada ({downPaymentPercentage}%)</span>
              <CreditCard className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-xl font-bold text-orange-900">
              {formatCurrency(breakdown.downPayment, currency)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Pagamento à vista</div>
          </div>

          {/* Total Cost */}
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Custo Total</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-xl font-bold text-green-900">
              {formatCurrency(breakdown.totalImportCost, currency)}
            </div>
            <div className="text-xs text-gray-500 mt-1">FOB + Taxa administrativa</div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <h4 className="font-semibold text-gray-900 mb-3">Detalhamento dos Custos</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">Valor da mercadoria (FOB)</span>
              <span className="font-medium">{formatCurrency(breakdown.fobValue, currency)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-gray-100">
              <span className="text-sm text-gray-600">Entrada ({downPaymentPercentage}%)</span>
              <span className="font-medium text-orange-700">
                -{formatCurrency(breakdown.downPayment, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">Valor financiado</span>
              <span className="font-medium">{formatCurrency(breakdown.financedAmount, currency)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">Taxa administrativa ({adminFeePercentage}%)</span>
              <span className="font-medium text-blue-700">
                +{formatCurrency(breakdown.adminFee, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-t-2 border-gray-200 font-semibold">
              <span className="text-gray-900">Total da importação</span>
              <span className="text-lg text-gray-900">
                {formatCurrency(breakdown.totalImportCost, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <h4 className="font-semibold text-amber-900 mb-2">Resumo de Pagamentos</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-amber-700">Pagamento imediato:</span>
              <div className="font-semibold text-amber-900">
                {formatCurrency(breakdown.downPayment, currency)}
              </div>
            </div>
            <div>
              <span className="text-amber-700">Parcelado via crédito:</span>
              <div className="font-semibold text-amber-900">
                {formatCurrency(breakdown.financedAmount + breakdown.adminFee, currency)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}