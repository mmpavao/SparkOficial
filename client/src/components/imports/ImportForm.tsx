import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const importFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  supplierId: z.string().optional(),
  cargoType: z.enum(["FCL", "LCL"]),
  totalValue: z.number().positive("Valor deve ser positivo"),
  currency: z.enum(["USD", "CNY", "EUR"]),
  incoterms: z.enum(["FOB", "CIF", "EXW"]),
  origin: z.string().min(1, "Origem é obrigatória"),
  destination: z.string().min(1, "Destino é obrigatório"),
  estimatedDelivery: z.string().min(1, "Data estimada é obrigatória"),
  description: z.string().optional(),
  containerNumber: z.string().optional(),
  containerSeal: z.string().optional(),
});

type ImportFormData = z.infer<typeof importFormSchema>;

interface Product {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  supplierId?: number;
  description?: string;
}

interface Supplier {
  id: number;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  location: string;
}

export default function ImportForm() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [products, setProducts] = useState<Product[]>([]);

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importFormSchema),
    defaultValues: {
      cargoType: "FCL",
      currency: "USD",
      incoterms: "FOB",
      totalValue: 0,
    },
  });

  const cargoType = form.watch("cargoType");
  const totalValue = form.watch("totalValue") || 0;

  // Fetch suppliers for dropdown
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Create import mutation
  const createImportMutation = useMutation({
    mutationFn: async (data: ImportFormData & { products?: Product[] }) => {
      return apiRequest("/api/imports", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      setLocation("/imports");
    },
  });

  // Calculate total value for LCL from products
  const calculateTotalValue = () => {
    if (cargoType === "LCL") {
      return products.reduce((total, product) => total + (product.quantity * product.unitPrice), 0);
    }
    return totalValue;
  };

  const onSubmit = (data: ImportFormData) => {
    const finalValue = cargoType === "LCL" ? calculateTotalValue() : data.totalValue;
    
    const importData = {
      ...data,
      totalValue: finalValue,
      products: cargoType === "LCL" ? products : undefined,
      status: "planejamento",
    };

    createImportMutation.mutate(importData);
  };

  const addProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name: "",
      quantity: 1,
      unitPrice: 0,
      description: "",
    };
    setProducts([...products, newProduct]);
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const updateProduct = (id: string, field: keyof Product, value: any) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Nova Importação</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Importação</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Ex: Importação Eletrônicos Q1"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="cargoType">Tipo de Carga</Label>
                <Select value={cargoType} onValueChange={(value) => form.setValue("cargoType", value as "FCL" | "LCL")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FCL">FCL (Container Completo)</SelectItem>
                    <SelectItem value="LCL">LCL (Carga Fracionada)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="origin">Origem</Label>
                <Input
                  id="origin"
                  {...form.register("origin")}
                  placeholder="Ex: Shenzhen, China"
                />
              </div>
              
              <div>
                <Label htmlFor="destination">Destino</Label>
                <Input
                  id="destination"
                  {...form.register("destination")}
                  placeholder="Ex: Santos, Brasil"
                />
              </div>
              
              <div>
                <Label htmlFor="estimatedDelivery">Entrega Estimada</Label>
                <Input
                  id="estimatedDelivery"
                  type="date"
                  {...form.register("estimatedDelivery")}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Descrição adicional da importação..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Cargo Type Specific Content */}
        {cargoType === "FCL" && (
          <Card>
            <CardHeader>
              <CardTitle>Informações do Container</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="totalValue">Valor Total (USD)</Label>
                  <Input
                    id="totalValue"
                    type="number"
                    step="0.01"
                    {...form.register("totalValue", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="currency">Moeda</Label>
                  <Select value={form.watch("currency")} onValueChange={(value) => form.setValue("currency", value as "USD" | "CNY" | "EUR")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="CNY">CNY</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="incoterms">Incoterms</Label>
                  <Select value={form.watch("incoterms")} onValueChange={(value) => form.setValue("incoterms", value as "FOB" | "CIF" | "EXW")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOB">FOB</SelectItem>
                      <SelectItem value="CIF">CIF</SelectItem>
                      <SelectItem value="EXW">EXW</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="containerNumber">Número do Container</Label>
                  <Input
                    id="containerNumber"
                    {...form.register("containerNumber")}
                    placeholder="Ex: MSKU1234567"
                  />
                </div>
                
                <div>
                  <Label htmlFor="containerSeal">Lacre do Container</Label>
                  <Input
                    id="containerSeal"
                    {...form.register("containerSeal")}
                    placeholder="Ex: 12345678"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {cargoType === "LCL" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Produtos
                <Button type="button" onClick={addProduct} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Produto
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {products.map((product, index) => (
                <div key={product.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Produto {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeProduct(product.id)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Nome do Produto</Label>
                      <Input
                        value={product.name}
                        onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                        placeholder="Ex: Smartphone"
                      />
                    </div>
                    
                    <div>
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        value={product.quantity}
                        onChange={(e) => updateProduct(product.id, "quantity", parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <Label>Preço Unitário (USD)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={product.unitPrice}
                        onChange={(e) => updateProduct(product.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <Label>Total</Label>
                      <div className="h-10 px-3 flex items-center bg-gray-50 border rounded-md">
                        ${(product.quantity * product.unitPrice).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Descrição (Opcional)</Label>
                    <Input
                      value={product.description || ""}
                      onChange={(e) => updateProduct(product.id, "description", e.target.value)}
                      placeholder="Descrição do produto..."
                    />
                  </div>
                </div>
              ))}
              
              {products.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Valor Total:</span>
                    <span className="text-xl font-bold">
                      ${calculateTotalValue().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/imports")}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={createImportMutation.isPending}
          >
            {createImportMutation.isPending ? "Criando..." : "Criar Importação"}
          </Button>
        </div>
      </form>
    </div>
  );
}