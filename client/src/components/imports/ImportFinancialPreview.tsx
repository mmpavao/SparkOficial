import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, Calculator, AlertTriangle, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useQuery } from "@tanstack/react-query";

interface ImportFinancialPreviewProps {
  fobValue: number;
  currency?: string;
  incoterms?: string;
  showCreditCheck?: boolean;
}

interface CreditInfo {
  totalCredit: number;
  usedCredit: number;
  availableCredit: number;
  adminFeePercentage: number;
}

interface FinancialSettings {
  adminFeePercentage: number;
  downPaymentPercentage: number;
  paymentTerms: string;
}

export default function ImportFinancialPreview({ 
  fobValue, 
  currency = "USD",
  incoterms = "FOB",
  showCreditCheck = true
}: ImportFinancialPreviewProps) {
  
  // Fetch credit information for validation
  const { data: creditInfo } = useQuery<CreditInfo>({
    queryKey: ["/api/user/credit-info"],
    enabled: showCreditCheck
  });

  // Fetch user-specific financial settings
  const { data: financialSettings, isLoading: settingsLoading, error: settingsError } = useQuery<FinancialSettings>({
    queryKey: ["/api/user/financial-settings"],
    enabled: showCreditCheck,
    retry: 3,
    refetchOnWindowFocus: false
  });

  // Debug logging
  console.log("🔄 Settings Loading:", settingsLoading);
  console.log("❌ Settings Error:", settingsError);
  console.log("💰 Financial Settings:", financialSettings);
  console.log("💳 Credit Info:", creditInfo);

  const adminFeePercentage = financialSettings?.adminFeePercentage || creditInfo?.adminFeePercentage || 10;
  const downPaymentPercentage = financialSettings?.downPaymentPercentage || 30;

  console.log("📊 Final values - Admin Fee:", adminFeePercentage, "Down Payment:", downPaymentPercentage);

  // Calculate all costs
  const downPayment = fobValue * (downPaymentPercentage / 100);
  const financedAmount = fobValue - downPayment;
  const adminFee = financedAmount * (adminFeePercentage / 100);
  const totalImportCost = fobValue + adminFee;
  const totalCreditNeeded = financedAmount + adminFee;

  // Credit validation - using total FOB value as per business rule
  const availableCredit = creditInfo?.availableCredit || 0;
  const hasEnoughCredit = fobValue <= availableCredit;

  return (
    <div className="space-y-4">
      {/* Main Financial Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Preview Financeiro
            </CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
              {incoterms}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="text-sm text-gray-600">Valor FOB</div>
              <div className="text-xl font-bold text-blue-900">
                {formatCurrency(fobValue, currency)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <div className="text-sm text-gray-600">Custo Total</div>
              <div className="text-xl font-bold text-green-900">
                {formatCurrency(totalImportCost, currency)}
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-3">Detalhamento dos Custos</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Valor da mercadoria (FOB)</span>
                <span className="font-medium">{formatCurrency(fobValue, currency)}</span>
              </div>
              <div className="flex justify-between text-orange-700">
                <span>Entrada ({downPaymentPercentage}%)</span>
                <span className="font-medium">-{formatCurrency(downPayment, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor financiado</span>
                <span className="font-medium">{formatCurrency(financedAmount, currency)}</span>
              </div>
              <div className="flex justify-between text-blue-700">
                <span>Taxa administrativa ({adminFeePercentage}%)</span>
                <span className="font-medium">+{formatCurrency(adminFee, currency)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total da importação</span>
                <span className="text-lg">{formatCurrency(totalImportCost, currency)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Validation */}
      {showCreditCheck && creditInfo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Validação de Crédito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Valor necessário:</span>
                <span className="font-medium">{formatCurrency(fobValue, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Crédito disponível:</span>
                <span className="font-medium">{formatCurrency(availableCredit, currency)}</span>
              </div>
              
              {hasEnoughCredit ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Crédito suficiente. Sobrando: {formatCurrency(availableCredit - fobValue, currency)} disponíveis
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Crédito insuficiente. Necessário: {formatCurrency(fobValue - availableCredit, currency)} adicional
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Schedule Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Cronograma de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <span className="font-medium text-orange-800">Entrada (na confirmação)</span>
              <span className="text-lg font-bold text-orange-900">
                {formatCurrency(downPayment, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="font-medium text-blue-800">Parcelado via crédito</span>
              <span className="text-lg font-bold text-blue-900">
                {formatCurrency(totalCreditNeeded, currency)}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              * Pagamento parcelado será dividido conforme termos aprovados no crédito
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}