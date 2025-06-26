import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package } from "lucide-react";

export default function ImportEditPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/imports")}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Editar Importação</h2>
          <p className="text-muted-foreground">
            Editando importação ID: {id}
          </p>
        </div>
      </div>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Edição de Importação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Página em Desenvolvimento</h3>
            <p className="text-muted-foreground mb-4">
              A funcionalidade de edição de importações será implementada no Sprint 2.2
            </p>
            <Button onClick={() => setLocation("/imports")}>
              Voltar para Importações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}