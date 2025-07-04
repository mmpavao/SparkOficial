import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, DollarSign, Calendar, CreditCard } from "lucide-react";

interface ImportTermsConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  importData: any;
  financialData: any;
  isLoading?: boolean;
}

export function ImportTermsConfirmation({
  isOpen,
  onClose,
  onConfirm,
  importData,
  financialData,
  isLoading = false
}: ImportTermsConfirmationProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedCosts, setAcceptedCosts] = useState(false);
  const [acceptedPayment, setAcceptedPayment] = useState(false);

  const canConfirm = acceptedTerms && acceptedCosts && acceptedPayment;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
    }
  };

  if (!financialData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Confirmação de Termos e Condições
          </DialogTitle>
          <DialogDescription>
            Revise e aceite os termos financeiros da sua importação antes de prosseguir
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo da Importação */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Resumo da Importação</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Nome da Importação:</span>
                  <p className="font-medium">{importData.importName}</p>
                </div>
                <div>
                  <span className="text-gray-600">Fornecedor:</span>
                  <p className="font-medium">{importData.supplierName}</p>
                </div>
                <div>
                  <span className="text-gray-600">Tipo de Carga:</span>
                  <p className="font-medium">{importData.cargoType}</p>
                </div>
                <div>
                  <span className="text-gray-600">Incoterms:</span>
                  <p className="font-medium">{importData.incoterms}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhamento Financeiro */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Detalhamento Financeiro
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor FOB da Importação:</span>
                  <span className="font-medium">US$ {financialData.fobValue.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-orange-600">
                  <span>Entrada Requerida ({financialData.downPaymentPercent}%):</span>
                  <span className="font-medium">US$ {financialData.downPayment.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor a Financiar:</span>
                  <span className="font-medium">US$ {financialData.financedAmount.toLocaleString()}</span>
                </div>
                
                {financialData.adminFeePercent > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Taxa Administrativa ({financialData.adminFeePercent}%):</span>
                    <span className="font-medium">US$ {financialData.adminFee.toLocaleString()}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total da Operação:</span>
                  <span>US$ {financialData.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Condições de Pagamento */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Condições de Pagamento
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="bg-orange-50 p-3 rounded border border-orange-200">
                  <p className="font-medium text-orange-800">Pagamento Imediato:</p>
                  <p className="text-orange-700">
                    Entrada de US$ {financialData.downPayment.toLocaleString()} 
                    será debitada automaticamente após confirmação
                  </p>
                </div>
                
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="font-medium text-blue-800">Parcelas Futuras:</p>
                  <p className="text-blue-700">
                    {financialData.paymentTerms.length} parcelas de US$ {financialData.installmentAmount.toLocaleString()} 
                    cada ({financialData.paymentTerms.join(', ')} dias)
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    * Parcelas iniciam quando importação for "Entregue ao Agente"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Termos e Condições */}
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 mb-2">Importantes Condições:</p>
                  <ul className="text-amber-700 space-y-1 list-disc list-inside">
                    <li>A entrada deve ser paga antecipadamente em até 5 dias úteis</li>
                    <li>Taxa administrativa incide apenas sobre o valor financiado</li>
                    <li>Parcelas seguem os prazos estabelecidos no seu contrato de crédito</li>
                    <li>Cancelamento após confirmação está sujeito a taxas contratuais</li>
                    <li>Todos os valores são em dólares americanos (USD)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Checkboxes de Confirmação */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="terms" 
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  className="mt-1"
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed">
                  Eu li e aceito os <strong>termos e condições gerais</strong> desta importação, 
                  incluindo prazos de entrega e responsabilidades contratuais.
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox 
                  id="costs" 
                  checked={acceptedCosts}
                  onCheckedChange={(checked) => setAcceptedCosts(checked === true)}
                  className="mt-1"
                />
                <Label htmlFor="costs" className="text-sm leading-relaxed">
                  Eu confirmo e aceito todos os <strong>custos financeiros</strong> desta operação, 
                  incluindo taxa administrativa e condições de parcelamento.
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox 
                  id="payment" 
                  checked={acceptedPayment}
                  onCheckedChange={(checked) => setAcceptedPayment(checked === true)}
                  className="mt-1"
                />
                <Label htmlFor="payment" className="text-sm leading-relaxed">
                  Eu confirmo que farei o <strong>pagamento da entrada</strong> de 
                  US$ {financialData.downPayment.toLocaleString()} em até <strong>5 dias úteis</strong> após aprovação desta importação.
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Processando..." : "Confirmar e Criar Importação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}