import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, CreditCard, Calendar, AlertTriangle } from "lucide-react";

interface ImportFinancialPreviewProps {
  importValue: number;
  creditApplication: any;
  creditUsage: any;
  adminFee?: any;
}

export function ImportFinancialPreview({ 
  importValue, 
  creditApplication, 
  creditUsage,
  adminFee: adminFeeData 
}: ImportFinancialPreviewProps) {
  
  const financialCalculation = useMemo(() => {
    if (!creditApplication) {
      return null;
    }
    
    // Show preview even with zero value to guide user
    const calculationValue = importValue || 0;

    const downPaymentPercent = creditApplication.finalDownPayment || 30;
    const adminFeePercent = parseFloat(adminFeeData?.feePercentage || '0');
    const paymentTerms = (creditApplication.finalApprovedTerms || '30').split(',').map((term: string) => parseInt(term.trim()));

    const downPayment = (calculationValue * downPaymentPercent) / 100;
    const financedAmount = calculationValue - downPayment;
    const calculatedAdminFee = (financedAmount * adminFeePercent) / 100;
    const totalAmount = calculationValue + calculatedAdminFee;
    const installmentAmount = financedAmount / paymentTerms.length;

    const availableCredit = creditUsage ? creditUsage.available : 0;
    const exceedsLimit = financedAmount > availableCredit;

    return {
      fobValue: calculationValue,
      downPayment,
      downPaymentPercent,
      financedAmount,
      adminFee: calculatedAdminFee,
      adminFeePercent,
      totalAmount,
      installmentAmount,
      paymentTerms,
      availableCredit,
      exceedsLimit,
      remainingCredit: availableCredit - financedAmount
    };
  }, [importValue, creditApplication, creditUsage, adminFeeData]);

  if (!financialCalculation) {
    return (
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Prévia Financeira
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-gray-500">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Insira o valor da importação para ver a prévia financeira</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { 
    fobValue, 
    downPayment, 
    downPaymentPercent,
    financedAmount, 
    adminFee: calculatedAdminFee, 
    adminFeePercent,
    totalAmount, 
    installmentAmount,
    paymentTerms,
    availableCredit,
    exceedsLimit,
    remainingCredit
  } = financialCalculation;

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Prévia Financeira
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Saldo Disponível */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">Crédito Disponível</span>
            <span className="text-lg font-bold text-blue-600">
              US$ {availableCredit.toLocaleString()}
            </span>
          </div>
        </div>

        <Separator />

        {/* Valores da Importação */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Detalhamento da Importação</h4>
          
          {/* Valor FOB */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Valor FOB</span>
            <span className="font-medium">US$ {fobValue.toLocaleString()}</span>
          </div>

          {/* Entrada */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Entrada ({downPaymentPercent}%)</span>
            <span className="font-medium text-orange-600">
              US$ {downPayment.toLocaleString()}
            </span>
          </div>

          {/* Valor a Financiar */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Valor a Financiar</span>
            <span className="font-medium">US$ {financedAmount.toLocaleString()}</span>
          </div>

          {/* Taxa Administrativa */}
          {adminFeePercent > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Taxa Admin ({adminFeePercent}%)</span>
              <span className="font-medium text-red-600">
                US$ {calculatedAdminFee.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Total Geral */}
        <div className="bg-gray-50 p-3 rounded-lg border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-800">Total da Operação</span>
            <span className="text-xl font-bold text-gray-900">
              US$ {totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Parcelamento */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium text-gray-900">Parcelamento</span>
          </div>
          <div className="text-sm text-gray-600">
            <p>Entrada: US$ {downPayment.toLocaleString()}</p>
            <p>
              {paymentTerms.length}x de US$ {installmentAmount.toLocaleString()} 
              <span className="ml-1">({paymentTerms.join(', ')} dias)</span>
            </p>
          </div>
        </div>

        {/* Alerta de Limite */}
        {exceedsLimit && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Limite Insuficiente</p>
                <p className="text-red-700 mt-1">
                  Valor a financiar excede o crédito disponível em US$ {Math.abs(remainingCredit).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Saldo Restante */}
        {!exceedsLimit && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">Saldo Restante</span>
              <span className="text-sm font-bold text-green-600">
                US$ {remainingCredit.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Informações Importantes */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Entrada deve ser paga na criação da importação</p>
          <p>• Parcelas iniciam quando status = "Entregue ao Agente"</p>
          <p>• Taxa administrativa incide apenas sobre valor financiado</p>
        </div>
      </CardContent>
    </Card>
  );
}