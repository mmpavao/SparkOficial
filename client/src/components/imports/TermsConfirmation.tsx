import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, AlertTriangle, DollarSign, Calculator, CreditCard, FileText } from "lucide-react";
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
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const adminFeePercentage = 10;
  const downPaymentPercentage = 30;
  
  const downPayment = importValue * (downPaymentPercentage / 100);
  const financedAmount = importValue - downPayment;
  const adminFee = financedAmount * (adminFeePercentage / 100);
  const totalImportCost = importValue + adminFee;
  const totalCreditUsed = financedAmount + adminFee;

  useEffect(() => {
    if (open) {
      setHasScrolledToEnd(false);
      setTermsAccepted(false);
    }
  }, [open]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const scrolledToEnd = scrollTop + clientHeight >= scrollHeight - 10;
      setHasScrolledToEnd(scrolledToEnd);
    }
  };

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
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Contrato Digital - Spark Comex
              </h3>
              
              <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="max-h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50 space-y-4 text-sm"
              >
                <div>
                  <h4 className="font-semibold mb-2">1. OBJETO DO CONTRATO</h4>
                  <p>Este contrato estabelece as condições para a operação de importação através da plataforma Spark Comex, incluindo financiamento de mercadorias, gestão de documentos e acompanhamento logístico.</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">2. CONDIÇÕES FINANCEIRAS</h4>
                  <ul className="space-y-1 ml-4">
                    <li>• Entrada obrigatória de {downPaymentPercentage}% do valor FOB na confirmação</li>
                    <li>• Taxa administrativa de {adminFeePercentage}% aplicada sobre o valor financiado</li>
                    <li>• Financiamento conforme termos de crédito previamente aprovados</li>
                    <li>• Valores sujeitos a variações cambiais até o fechamento</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">3. RESPONSABILIDADES DO IMPORTADOR</h4>
                  <ul className="space-y-1 ml-4">
                    <li>• Fornecimento de documentos corretos e dentro dos prazos</li>
                    <li>• Pagamento das taxas e impostos devidos na importação</li>
                    <li>• Comunicação imediata de alterações nos dados da operação</li>
                    <li>• Cumprimento das obrigações fiscais e regulamentares</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">4. RESPONSABILIDADES DA SPARK COMEX</h4>
                  <ul className="space-y-1 ml-4">
                    <li>• Gestão e acompanhamento da operação de importação</li>
                    <li>• Financiamento conforme condições aprovadas</li>
                    <li>• Suporte na documentação e trâmites aduaneiros</li>
                    <li>• Transparência nas informações e custos envolvidos</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">5. PAGAMENTOS E VENCIMENTOS</h4>
                  <ul className="space-y-1 ml-4">
                    <li>• Entrada: {formatCurrency(downPayment, currency)} na confirmação</li>
                    <li>• Valor financiado: {formatCurrency(totalCreditUsed, currency)}</li>
                    <li>• Parcelamento conforme cronograma aprovado no crédito</li>
                    <li>• Juros e encargos conforme tabela vigente</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">6. CANCELAMENTO E ALTERAÇÕES</h4>
                  <p>Cancelamentos só serão aceitos antes do início da produção. Alterações significativas podem gerar custos adicionais e devem ser previamente aprovadas.</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">7. DISPOSIÇÕES GERAIS</h4>
                  <ul className="space-y-1 ml-4">
                    <li>• Este contrato é regido pelas leis brasileiras</li>
                    <li>• Foro competente: comarca de São Paulo/SP</li>
                    <li>• Contrato válido por assinatura digital na plataforma</li>
                    <li>• Eventuais conflitos serão resolvidos por mediação</li>
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-center font-semibold">
                    Spark Comex - Soluções em Importação<br/>
                    CNPJ: 00.000.000/0001-00<br/>
                    contato@sparkcomex.com | (11) 99999-9999
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="terms-acceptance"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                    disabled={!hasScrolledToEnd}
                  />
                  <label 
                    htmlFor="terms-acceptance" 
                    className={`text-sm ${!hasScrolledToEnd ? 'text-gray-400' : 'text-gray-900'}`}
                  >
                    Li e aceito todos os termos e condições do contrato
                  </label>
                </div>
                {!hasScrolledToEnd && (
                  <p className="text-xs text-amber-600 mt-2">
                    Você deve rolar até o final dos termos para poder aceitar o contrato.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

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
          <Button 
            onClick={onConfirm} 
            className="bg-green-600 hover:bg-green-700"
            disabled={!termsAccepted}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirmar e Criar Importação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}