import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, DollarSign, Calculator, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface TermsConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  importValue: number;
  currency: string;
}

export default function TermsConfirmation({
  open,
  onOpenChange,
  onConfirm,
  importValue,
  currency
}: TermsConfirmationProps) {
  const adminFeePercentage = 10;
  const downPaymentPercentage = 30;
  
  const downPayment = importValue * (downPaymentPercentage / 100);
  const financedAmount = importValue - downPayment;
  const adminFee = financedAmount * (adminFeePercentage / 100);
  const totalImportCost = importValue + adminFee;
  const totalCreditUsed = financedAmount + adminFee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calculator className="w-6 h-6 text-blue-600" />
            Confirmação de Termos Financeiros
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Financial Summary */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg text-blue-900 mb-4">Resumo Financeiro</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="text-sm text-gray-600">Valor FOB</div>
                  <div className="text-xl font-bold text-blue-900">
                    {formatCurrency(importValue, currency)}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="text-sm text-gray-600">Custo Total</div>
                  <div className="text-xl font-bold text-green-900">
                    {formatCurrency(totalImportCost, currency)}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor da mercadoria (FOB)</span>
                  <span className="font-medium">{formatCurrency(importValue, currency)}</span>
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
            </CardContent>
          </Card>

          {/* Payment Schedule */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Cronograma de Pagamentos
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <span className="font-medium text-orange-800">Entrada (na confirmação)</span>
                    <p className="text-sm text-orange-600">Pagamento à vista</p>
                  </div>
                  <span className="text-lg font-bold text-orange-900">
                    {formatCurrency(downPayment, currency)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <span className="font-medium text-blue-800">Parcelado via crédito</span>
                    <p className="text-sm text-blue-600">Conforme termos aprovados</p>
                  </div>
                  <span className="text-lg font-bold text-blue-900">
                    {formatCurrency(totalCreditUsed, currency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Termos e Condições:</p>
                <ul className="space-y-1 text-sm">
                  <li>• A entrada de {downPaymentPercentage}% deve ser paga na confirmação da importação</li>
                  <li>• Taxa administrativa de {adminFeePercentage}% aplicada apenas no valor financiado</li>
                  <li>• Pagamento parcelado conforme termos do crédito aprovado</li>
                  <li>• Esta importação utilizará {formatCurrency(totalCreditUsed, currency)} do seu limite de crédito</li>
                  <li>• Todos os valores estão sujeitos a variações cambiais</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Credit Usage Warning */}
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Importante:</strong> Ao confirmar, esta importação será vinculada ao seu crédito aprovado e 
              o valor de {formatCurrency(totalCreditUsed, currency)} será reservado do seu limite disponível.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Revisar
          </Button>
          <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirmar e Criar Importação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}