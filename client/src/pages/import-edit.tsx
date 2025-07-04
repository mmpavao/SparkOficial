import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ImportForm } from "@/components/imports/ImportForm";

export default function ImportEditPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  // Fetch import data
  const { data: importData, isLoading } = useQuery({
    queryKey: ['/api/imports', id],
    queryFn: async () => {
      const response = await fetch(`/api/imports/${id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Importação não encontrada');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!importData) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => setLocation('/imports')}
            className="p-2"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Importação não encontrada</h1>
        </div>
      </div>
    );
  }

  // Use the same ImportForm component with editing mode
  return <ImportForm initialData={importData} isEditing={true} />;
}