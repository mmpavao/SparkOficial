import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import PaymentCheckoutModal from "@/components/payments/PaymentCheckoutModal";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PaymentCheckoutUnifiedPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(true);

  // Verificar se o pagamento existe
  const { data: payment, isLoading } = useQuery({
    queryKey: ['/api/payment-schedules', id],
    queryFn: () => apiRequest(`/api/payment-schedules/${id}`, 'GET'),
    enabled: !!id && !!user
  });

  // Redirecionar para detalhes quando modal for fechado
  const handleModalClose = () => {
    setCheckoutModalOpen(false);
    setLocation(`/payments/${id}`);
  };

  // Redirecionar se pagamento não existir
  useEffect(() => {
    if (!isLoading && !payment) {
      setLocation('/payments');
    }
  }, [payment, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pagamento não encontrado</h2>
          <Button onClick={() => setLocation('/payments')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Pagamentos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header de backup caso o modal não abra */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout de Pagamento</h1>
        <p className="text-gray-600">Pagamento #{payment.id}</p>
        <Button 
          variant="outline" 
          onClick={() => setLocation(`/payments/${id}`)}
          className="mt-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos Detalhes
        </Button>
      </div>

      {/* PaymentCheckoutModal Unificado */}
      <PaymentCheckoutModal
        isOpen={checkoutModalOpen}
        onClose={handleModalClose}
        paymentId={parseInt(id || "0")}
      />
    </div>
  );
}