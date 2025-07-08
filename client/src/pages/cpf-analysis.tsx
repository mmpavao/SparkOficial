import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import CPFAnalysis from "@/components/credit/CPFAnalysis";

export default function CPFAnalysisPage() {
  return (
    <AuthenticatedLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Análise de CPF</h1>
            <p className="text-gray-600 mt-1">
              Consulte informações de crédito e gere relatórios profissionais para pessoas físicas
            </p>
          </div>
          
          <CPFAnalysis />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}