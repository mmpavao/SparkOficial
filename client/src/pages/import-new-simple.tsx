import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Package, Truck, Plus, Trash2 } from "lucide-react";

// Product schema for multiple products
const productSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório"),
  description: z.string().min(5, "Descrição é obrigatória"),
  quantity: z.number().min(1, "Quantidade deve ser maior que 0"),
  unitPrice: z.string().min(1, "Preço unitário é obrigatório"),
  totalValue: z.string().min(1, "Valor total é obrigatório"),
  supplierId: z.number().min(1, "Fornecedor é obrigatório"),
  hsCode: z.string().optional(),
});

// Complete import schema with FCL/LCL support
const importSchema = z.object({
  importName: z.string().min(3, "Nome da importação é obrigatório"),
  cargoType: z.enum(["FCL", "LCL"]).default("FCL"),
  supplierName: z.string().optional(), // For FCL compatibility
  supplierLocation: z.string().optional(), // For FCL compatibility
  products: z.array(productSchema).min(1, "Pelo menos um produto é obrigatório"),
  totalValue: z.string().min(1, "Valor total é obrigatório"),
  currency: z.string().default("USD"),
  incoterms: z.string().default("FOB"),
  shippingMethod: z.string().default("sea"),
  containerType: z.string().default("20ft"),
  containerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
  estimatedDelivery: z.string().optional(),
});

type ImportFormData = z.infer<typeof importSchema>;
type ProductFormData = z.infer<typeof productSchema>;

export default function ImportNewSimple() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      importName: "",
      supplierName: "",
      supplierLocation: "",
      productName: "",
      productDescription: "",
      quantity: 1,
      unitPrice: "",
      totalValue: "",
      currency: "USD",
      incoterms: "FOB",
      shippingMethod: "sea",
      containerType: "20ft",
      cargoType: "FCL",
      estimatedDelivery: "",
    },
  });

  const createImportMutation = useMutation({
    mutationFn: async (data: ImportFormData) => {
      console.log("Creating import with data:", data);
      
      // Prepare data for API
      const apiData = {
        importName: data.importName,
        supplierName: data.supplierName,
        supplierLocation: data.supplierLocation,
        products: [{
          name: data.productName,
          description: data.productDescription,
          hsCode: "",
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          totalValue: data.totalValue
        }],
        totalValue: data.totalValue,
        currency: data.currency,
        incoterms: data.incoterms,
        shippingMethod: data.shippingMethod,
        containerType: data.containerType,
        cargoType: data.cargoType,
        estimatedDelivery: data.estimatedDelivery,
        status: "planning",
        currentStage: "estimativa",
        containerNumber: "",
        sealNumber: ""
      };
      
      return apiRequest('POST', '/api/imports', apiData);
    },
    onSuccess: () => {
      toast({
        title: "Importação criada!",
        description: "A nova importação foi criada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      setLocation('/imports');
    },
    onError: (error: any) => {
      console.error("Error creating import:", error);
      toast({
        title: "Erro ao criar importação",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ImportFormData) => {
    console.log("Form submitted:", data);
    createImportMutation.mutate(data);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/imports')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nova Importação</h1>
          <p className="text-muted-foreground">Cadastre uma nova operação de importação</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Informações da Importação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="importName">Nome/Código da Importação *</Label>
                <Input
                  id="importName"
                  {...form.register("importName")}
                  placeholder="Ex: IMP-2025-001"
                />
                {form.formState.errors.importName && (
                  <p className="text-sm text-red-500">{form.formState.errors.importName.message}</p>
                )}
              </div>
            </div>

            {/* Supplier Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierName">Nome do Fornecedor *</Label>
                <Input
                  id="supplierName"
                  {...form.register("supplierName")}
                  placeholder="Nome da empresa fornecedora"
                />
                {form.formState.errors.supplierName && (
                  <p className="text-sm text-red-500">{form.formState.errors.supplierName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierLocation">Localização do Fornecedor *</Label>
                <Input
                  id="supplierLocation"
                  {...form.register("supplierLocation")}
                  placeholder="Ex: Guangzhou, China"
                />
                {form.formState.errors.supplierLocation && (
                  <p className="text-sm text-red-500">{form.formState.errors.supplierLocation.message}</p>
                )}
              </div>
            </div>

            {/* Product Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Produto Principal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Nome do Produto *</Label>
                  <Input
                    id="productName"
                    {...form.register("productName")}
                    placeholder="Nome do produto"
                  />
                  {form.formState.errors.productName && (
                    <p className="text-sm text-red-500">{form.formState.errors.productName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    {...form.register("quantity", { valueAsNumber: true })}
                    placeholder="1"
                  />
                  {form.formState.errors.quantity && (
                    <p className="text-sm text-red-500">{form.formState.errors.quantity.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="productDescription">Descrição Detalhada *</Label>
                <Textarea
                  id="productDescription"
                  {...form.register("productDescription")}
                  placeholder="Descrição detalhada do produto, especificações técnicas, etc."
                  rows={3}
                />
                {form.formState.errors.productDescription && (
                  <p className="text-sm text-red-500">{form.formState.errors.productDescription.message}</p>
                )}
              </div>
            </div>

            {/* Pricing Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span>💰</span> Informações de Preço
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="incoterms">Tipo de Preço *</Label>
                  <Select
                    value={form.watch("incoterms")}
                    onValueChange={(value) => form.setValue("incoterms", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOB">FOB - Free On Board (sem frete/seguro)</SelectItem>
                      <SelectItem value="CIF">CIF - Cost, Insurance and Freight (com frete/seguro)</SelectItem>
                      <SelectItem value="EXW">EXW - Ex Works (retirada na fábrica)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Preço Unitário (USD) *</Label>
                  <Input
                    id="unitPrice"
                    {...form.register("unitPrice")}
                    placeholder="67"
                  />
                  {form.formState.errors.unitPrice && (
                    <p className="text-sm text-red-500">{form.formState.errors.unitPrice.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalValue">Valor Total (USD) *</Label>
                  <Input
                    id="totalValue"
                    {...form.register("totalValue")}
                    placeholder="50000"
                  />
                  {form.formState.errors.totalValue && (
                    <p className="text-sm text-red-500">{form.formState.errors.totalValue.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Transport Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Transporte
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shippingMethod">Método de Envio</Label>
                  <Select
                    value={form.watch("shippingMethod")}
                    onValueChange={(value) => form.setValue("shippingMethod", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sea">🚢 Marítimo</SelectItem>
                      <SelectItem value="air">✈️ Aéreo</SelectItem>
                      <SelectItem value="land">🚛 Terrestre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="containerType">Tipo de Container</Label>
                  <Select
                    value={form.watch("containerType")}
                    onValueChange={(value) => form.setValue("containerType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20ft">20ft Standard</SelectItem>
                      <SelectItem value="40ft">40ft Standard</SelectItem>
                      <SelectItem value="40ft-hc">40ft High Cube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedDelivery">Entrega Estimada</Label>
                  <Input
                    id="estimatedDelivery"
                    type="date"
                    {...form.register("estimatedDelivery")}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setLocation('/imports')}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createImportMutation.isPending}
                className="min-w-[120px]"
              >
                {createImportMutation.isPending ? "Criando..." : "Criar Importação"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}