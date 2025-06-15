import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Search, Plus, MapPin, Phone, Mail } from "lucide-react";
import SupplierManagement from "@/components/SupplierManagement";

export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const filteredSuppliers = suppliers.filter((supplier: any) =>
    supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-spark-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando fornecedores...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Fornecedores
          </h1>
          <p className="text-muted-foreground">Gerencie seus fornecedores chineses</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar fornecedores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Novo Fornecedor</CardTitle>
          </CardHeader>
          <CardContent>
            <SupplierManagement
              onSelectSupplier={() => setShowCreateForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier: any) => (
          <Card key={supplier.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{supplier.companyName}</CardTitle>
              <p className="text-sm text-muted-foreground">{supplier.contactName}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{supplier.city}, {supplier.country}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{supplier.phone}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{supplier.email}</span>
              </div>

              {supplier.productCategories && supplier.productCategories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {supplier.productCategories.slice(0, 3).map((category: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                    >
                      {category}
                    </span>
                  ))}
                  {supplier.productCategories.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      +{supplier.productCategories.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Especialização: {supplier.specialization || "Não informado"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSuppliers.length === 0 && !showCreateForm && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? "Tente ajustar os termos de busca"
              : "Comece adicionando seu primeiro fornecedor chinês"
            }
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Fornecedor
            </Button>
          )}
        </div>
      )}
    </div>
  );
}