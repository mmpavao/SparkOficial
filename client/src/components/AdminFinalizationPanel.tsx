import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CheckCircle, DollarSign, Calendar, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AdminFinalizationPanelProps {
  application: any;
  onUpdate: () => void;
}

interface UserFinancialSettings {
  adminFeePercentage: number;
  downPaymentPercentage: number;
  paymentTerms: string;
}

export function AdminFinalizationPanel({ application, onUpdate }: AdminFinalizationPanelProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch user-specific financial settings for this application
  const { data: userSettings } = useQuery<UserFinancialSettings>({
    queryKey: [`/api/admin/users/${application.userId}/financial-settings`],
    enabled: !!application.userId
  });

  console.log("👤 User Settings for Application:", userSettings);
  console.log("📝 Application Data:", { userId: application.userId, creditLimit: application.creditLimit });

  const [formData, setFormData] = useState({
    finalCreditLimit: application.creditLimit || "",
    finalApprovedTerms: "", // Iniciar vazio para evitar concatenação
    finalDownPayment: userSettings?.downPaymentPercentage?.toString() || application.finalDownPayment || "25",
    adminFee: userSettings?.adminFeePercentage?.toString() || application.adminFee || "8",
    adminFinalNotes: application.adminFinalNotes || ""
  });

  // Update form when user settings are loaded
  useEffect(() => {
    if (userSettings) {
      setFormData(prev => ({
        ...prev,
        finalDownPayment: userSettings.downPaymentPercentage?.toString() || prev.finalDownPayment,
        adminFee: userSettings.adminFeePercentage?.toString() || prev.adminFee,
        finalApprovedTerms: userSettings.paymentTerms || prev.finalApprovedTerms
      }));
    }
  }, [userSettings]);

  // Only show if application is financially approved but not admin finalized
  if (application.financialStatus !== 'approved' || application.adminStatus === 'admin_finalized') {
    return null;
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      await apiRequest(`/api/admin/credit/applications/${application.id}/finalize`, "PUT", {
        finalCreditLimit: formData.finalCreditLimit,
        finalApprovedTerms: formData.finalApprovedTerms,
        finalDownPayment: formData.finalDownPayment,
        adminFee: formData.adminFee,
        adminFinalNotes: formData.adminFinalNotes
      });

      toast({
        title: "Termos finalizados com sucesso",
        description: "Os termos foram finalizados e estão disponíveis para o cliente",
      });

      onUpdate();
    } catch (error) {
      console.error("Error finalizing application:", error);
      toast({
        title: "Erro ao finalizar termos",
        description: "Não foi possível finalizar os termos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentTermsArray = formData.finalApprovedTerms ? 
    formData.finalApprovedTerms.split(',').map(t => t.trim()) : [];

  const togglePaymentTerm = (term: string) => {
    const currentTerms = paymentTermsArray;
    const updatedTerms = currentTerms.includes(term)
      ? currentTerms.filter(t => t !== term)
      : [...currentTerms, term];
    
    setFormData(prev => ({
      ...prev,
      finalApprovedTerms: updatedTerms.join(', ')
    }));
  };

  const availableTerms = ['30', '60', '90', '120', '150', '180'];

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <CreditCard className="h-5 w-5" />
          Finalização Administrativa
        </CardTitle>
        <p className="text-sm text-amber-700">
          Revise e finalize os termos aprovados pela financeira antes de liberar para o cliente
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Financial Institution Approved Terms */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium mb-3 text-gray-800">Termos Aprovados pela Financeira</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Crédito Aprovado</Label>
              <div className="flex items-center gap-2 mt-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-700">
                  ${application.creditLimit ? Number(application.creditLimit).toLocaleString() : '0'}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Prazos Aprovados</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {application.approvedTerms?.split(',').map((term: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                    {term.trim()} dias
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Entrada</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="font-semibold text-orange-700">10% down payment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Final Terms Adjustment */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800">Ajustar Termos Finais</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="finalCreditLimit">Limite Final (USD)</Label>
              <Input
                id="finalCreditLimit"
                type="text"
                value={formData.finalCreditLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, finalCreditLimit: e.target.value }))}
                placeholder="Ex: 500000"
              />
            </div>
            
            <div>
              <Label htmlFor="finalDownPayment">Entrada Final (%)</Label>
              <Input
                id="finalDownPayment"
                type="text"
                value={formData.finalDownPayment}
                onChange={(e) => setFormData(prev => ({ ...prev, finalDownPayment: e.target.value }))}
                placeholder="Ex: 10"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="adminFee">Taxa Administrativa (%)</Label>
              <Input
                id="adminFee"
                type="text"
                value={formData.adminFee}
                onChange={(e) => setFormData(prev => ({ ...prev, adminFee: e.target.value }))}
                placeholder="Ex: 10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Taxa aplicada apenas no valor financiado (não inclui entrada)
              </p>
            </div>
          </div>

          <div>
            <Label>Prazos de Pagamento Finais</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {availableTerms.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => togglePaymentTerm(term)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    paymentTermsArray.includes(term)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {term} dias
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="adminFinalNotes">Observações Finais</Label>
            <Textarea
              id="adminFinalNotes"
              value={formData.adminFinalNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, adminFinalNotes: e.target.value }))}
              placeholder="Observações sobre os termos finais..."
              rows={3}
            />
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              disabled={isSubmitting}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isSubmitting ? "Finalizando..." : "Finalizar Termos"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Finalização dos Termos</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a finalizar os termos desta aplicação de crédito. 
                Após a finalização, os termos estarão disponíveis para visualização do cliente.
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Finalizando..." : "Confirmar Finalização"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}