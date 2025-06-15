import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  FileText, 
  Users, 
  Building2, 
  DollarSign,
  Download,
  AlertTriangle,
  Clock,
  Star
} from "lucide-react";

interface PreparationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

const requiredData = [
  {
    category: "Dados da Empresa",
    icon: Building2,
    color: "blue",
    items: [
      "Razão social completa",
      "CNPJ da empresa", 
      "Inscrições estadual e municipal",
      "Endereço completo com CEP",
      "Telefone e email de contato",
      "Website (se houver)"
    ]
  },
  {
    category: "Estrutura Societária", 
    icon: Users,
    color: "purple",
    items: [
      "Nome completo de todos os sócios",
      "CPF de cada sócio",
      "Percentual de participação de cada sócio",
      "Soma total deve ser 100%"
    ]
  },
  {
    category: "Informações Comerciais",
    icon: FileText, 
    color: "green",
    items: [
      "Setor de atuação da empresa",
      "Faturamento anual atual",
      "Principais produtos importados",
      "Principais mercados de origem (países)"
    ]
  },
  {
    category: "Dados do Crédito",
    icon: DollarSign,
    color: "yellow", 
    items: [
      "Valor em USD (entre $100.000 e $1.000.000)",
      "Finalidade específica do crédito",
      "Produtos detalhados a importar",
      "Justificativa completa da operação (mín. 50 caracteres)"
    ]
  }
];

const requiredDocuments = [
  { name: "Contrato Social", critical: true },
  { name: "Documentos dos Sócios (CPF e RG)", critical: true }
];

const optionalDocuments = [
  "Alvará de Funcionamento",
  "Certificado de Constituição", 
  "Demonstrações Financeiras (3 anos)",
  "Carta de Referência Bancária",
  "Relatório de Crédito da Empresa",
  "Certificado de Regularidade Fiscal",
  "Licenças de Importação",
  "Registro Alfandegário",
  "Lista de Principais Clientes"
];

export default function PreparationGuideModal({ isOpen, onClose, onContinue }: PreparationGuideModalProps) {
  const [showDocuments, setShowDocuments] = useState(false);

  const downloadGuide = () => {
    // TODO: Implement PDF generation
    console.log("Generating PDF guide...");
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "text-blue-600 bg-blue-50",
      purple: "text-purple-600 bg-purple-50", 
      green: "text-green-600 bg-green-50",
      yellow: "text-yellow-600 bg-yellow-50"
    };
    return colors[color as keyof typeof colors] || "text-gray-600 bg-gray-50";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 bg-spark-600 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            Prepare-se para o Sucesso!
          </DialogTitle>
          <p className="text-gray-600 mt-2">
            Antes de iniciar sua solicitação de crédito, vamos mostrar tudo que você precisará. 
            Isso garantirá um processo mais rápido e sem interrupções.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Time Estimate */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">Tempo Estimado</h3>
                <p className="text-sm text-blue-700">15-20 minutos com todos os dados em mãos</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b">
            <Button
              variant={!showDocuments ? "default" : "ghost"}
              onClick={() => setShowDocuments(false)}
              size="sm"
            >
              Dados Necessários
            </Button>
            <Button
              variant={showDocuments ? "default" : "ghost"}  
              onClick={() => setShowDocuments(true)}
              size="sm"
            >
              Documentos
            </Button>
          </div>

          {/* Data Requirements */}
          {!showDocuments && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requiredData.map((section, index) => {
                const IconComponent = section.icon;
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getColorClasses(section.color)}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <h3 className="font-semibold text-gray-900">{section.category}</h3>
                    </div>
                    <ul className="space-y-2">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {/* Document Requirements */}
          {showDocuments && (
            <div className="space-y-6">
              {/* Required Documents */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-semibold text-red-700">Documentos Obrigatórios</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {requiredDocuments.map((doc, index) => (
                    <div key={index} className="border border-red-200 bg-red-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-900">{doc.name}</span>
                        <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Optional Documents */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-blue-700">Documentos Complementares</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Estes documentos aceleram a análise, mas podem ser enviados posteriormente:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {optionalDocuments.map((doc, index) => (
                    <div key={index} className="border border-blue-200 bg-blue-50 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-900">{doc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Dicas para Acelerar sua Aprovação</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Tenha todos os dados de sócios organizados (nomes completos, CPFs e percentuais)</li>
              <li>• Prepare uma justificativa detalhada da operação</li>
              <li>• Documentos digitalizados em boa qualidade facilitam a análise</li>
              <li>• Informações precisas evitam solicitações de esclarecimentos</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={downloadGuide}
              variant="outline"
              className="flex-1 border-spark-600 text-spark-600 hover:bg-spark-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Guia Completo (PDF)
            </Button>
            <Button
              onClick={onContinue}
              className="flex-1 bg-spark-600 hover:bg-spark-700"
            >
              Tenho Tudo Pronto - Começar Aplicação
            </Button>
          </div>

          <div className="text-center">
            <Button variant="ghost" onClick={onClose} className="text-gray-500">
              Voltar e Me Preparar Melhor
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}