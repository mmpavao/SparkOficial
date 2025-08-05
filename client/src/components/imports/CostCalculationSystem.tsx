import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  DollarSign, 
  Calculator, 
  Package, 
  Truck, 
  Shield, 
  Plus,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  AlertTriangle
} from "lucide-react";

interface Product {
  id?: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  weight?: number;
  volume?: number;
  supplierId: number;
}

interface Supplier {
  id: number;
  companyName: string;
}

interface CustomCost {
  id: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed';
  category: 'taxes' | 'fees' | 'services' | 'import_data';
  value: number;
  currency: 'USD' | 'BRL';
  percentage?: number;
}

interface CostCalculationSystemProps {
  products: Product[];
  suppliers: Supplier[];
  incoterm: string;
  onCostsChange?: (costs: any) => void;
}

export function CostCalculationSystem({ 
  products, 
  suppliers, 
  incoterm,
  onCostsChange 
}: CostCalculationSystemProps) {
  // Estados principais
  const [internationalFreight, setInternationalFreight] = useState<number>(0);
  const [insurance, setInsurance] = useState<number>(0);
  const [declaredFobAdjustment, setDeclaredFobAdjustment] = useState<number>(100); // Percentual
  const [usdToBrlRate, setUsdToBrlRate] = useState<number>(5.30);
  const [customCosts, setCustomCosts] = useState<CustomCost[]>([]);
  const [showDeclaredValues, setShowDeclaredValues] = useState<boolean>(false);
  const [showRealValues, setShowRealValues] = useState<boolean>(false);

  // Estados para adicionar custos
  const [isAddCostOpen, setIsAddCostOpen] = useState<boolean>(false);
  const [newCost, setNewCost] = useState<Partial<CustomCost>>({
    type: 'fixed',
    category: 'fees',
    currency: 'BRL'
  });

  // Cálculos base
  const totalFobValue = products.reduce((sum, p) => sum + (Number(p.quantity || 0) * Number(p.unitPrice || 0)), 0);
  const declaredFobValue = totalFobValue * (declaredFobAdjustment / 100);
  
  // CIF calculado baseado no Incoterm
  const calculateCif = () => {
    if (incoterm === 'CIF') {
      return declaredFobValue; // Já inclui frete e seguro
    } else if (incoterm === 'CFR') {
      return declaredFobValue + insurance; // Inclui frete, adiciona seguro
    } else { // FOB
      return declaredFobValue + internationalFreight + insurance;
    }
  };

  const cifValue = calculateCif();
  const cifInBrl = cifValue * usdToBrlRate;

  // Impostos percentuais padrão do Brasil
  const defaultTaxes = [
    { name: 'Imposto de Importação', percentage: 14, value: cifInBrl * 0.14 },
    { name: 'IPI', percentage: 15, value: cifInBrl * 0.15 },
    { name: 'PIS', percentage: 1.65, value: cifInBrl * 0.0165 },
    { name: 'COFINS', percentage: 7.6, value: cifInBrl * 0.076 },
    { name: 'ICMS', percentage: 18, value: cifInBrl * 0.18 }
  ];

  // Taxas fixas padrão
  const defaultFees = [
    { name: 'Despacho Aduaneiro', value: 800, currency: 'BRL' },
    { name: 'Armazenagem', value: 450, currency: 'BRL' },
    { name: 'THC (Terminal Handling Charge)', value: 120, currency: 'USD' },
    { name: 'SISCOMEX', value: 215, currency: 'BRL' }
  ];

  // Serviços padrão
  const defaultServices = [
    { name: 'Transporte Nacional', value: 1200, currency: 'BRL' },
    { name: 'Descarga', value: 350, currency: 'BRL' },
    { name: 'Escolta (opcional)', value: 800, currency: 'BRL' }
  ];

  // Função para adicionar custo customizado
  const addCustomCost = () => {
    if (newCost.name && newCost.value !== undefined) {
      const cost: CustomCost = {
        id: Date.now().toString(),
        name: newCost.name!,
        description: newCost.description || '',
        type: newCost.type!,
        category: newCost.category!,
        value: newCost.value!,
        currency: newCost.currency!,
        percentage: newCost.type === 'percentage' ? newCost.value : undefined
      };
      
      setCustomCosts([...customCosts, cost]);
      setNewCost({ type: 'fixed', category: 'fees', currency: 'BRL' });
      setIsAddCostOpen(false);
    }
  };

  // Calcular custos customizados por categoria
  const getCustomCostsByCategory = (category: string) => {
    return customCosts.filter(cost => cost.category === category);
  };

  const calculateCustomCostValue = (cost: CustomCost) => {
    if (cost.type === 'percentage') {
      const base = cost.currency === 'USD' ? cifValue : cifInBrl;
      return base * (cost.percentage! / 100);
    }
    return cost.value;
  };

  // Totais
  const totalTaxes = defaultTaxes.reduce((sum, tax) => sum + tax.value, 0) + 
    getCustomCostsByCategory('taxes').reduce((sum, cost) => sum + calculateCustomCostValue(cost), 0);

  const totalFees = defaultFees.reduce((sum, fee) => sum + (fee.currency === 'USD' ? fee.value * usdToBrlRate : fee.value), 0) +
    getCustomCostsByCategory('fees').reduce((sum, cost) => sum + calculateCustomCostValue(cost), 0);

  const totalServices = defaultServices.reduce((sum, service) => sum + service.value, 0) +
    getCustomCostsByCategory('services').reduce((sum, cost) => sum + calculateCustomCostValue(cost), 0);

  const totalImportCosts = totalTaxes + totalFees + totalServices;
  const totalDeclaredImport = cifInBrl + totalImportCosts;

  // Valores reais (para o fornecedor)
  const realFobValue = totalFobValue; // Valor real FOB
  const realCifValue = realFobValue + internationalFreight + insurance;
  const realCifInBrl = realCifValue * usdToBrlRate;
  const totalRealImport = realCifInBrl + totalImportCosts;

  return (
    <div className="space-y-6">
      {/* Resumo dos Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produtos selecionados na aba anterior
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <div className="space-y-4">
              {/* Header com totais */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{products.length}</div>
                  <div className="text-sm text-blue-800">Total de Produtos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {products.reduce((sum, p) => sum + Number(p.quantity || 0), 0)}
                  </div>
                  <div className="text-sm text-green-800">Quantidade Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ${totalFobValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-purple-800">Valor FOB Total</div>
                </div>
              </div>

              {/* Lista de produtos com dados de transporte */}
              <div className="space-y-3">
                {products.map((product, index) => {
                  const supplier = suppliers.find(s => s.id === product.supplierId);
                  return (
                    <div key={index} className="border rounded-lg p-4 bg-white">
                      <h4 className="font-semibold text-lg mb-3">{product.productName}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Qtd:</span>
                          <div className="font-medium">{product.quantity}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Preço Unit.:</span>
                          <div className="font-medium">${Number(product.unitPrice || 0).toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Total:</span>
                          <div className="font-medium text-green-600">
                            ${(Number(product.quantity || 0) * Number(product.unitPrice || 0)).toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Peso (kg):</span>
                          <div className="font-medium">{product.weight || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Volume (m³):</span>
                          <div className="font-medium">{product.volume || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-600">Fornecedor:</span>
                        <div className="font-medium text-blue-600">{supplier?.companyName || 'Não especificado'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum produto adicionado ainda.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dados de Importação - FOB, Frete, Seguro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Dados de Importação
            <Dialog open={isAddCostOpen && newCost.category === 'import_data'} onOpenChange={setIsAddCostOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => setNewCost({...newCost, category: 'import_data'})}
                >
                  <Plus className="h-4 w-4" />
                  Add Custo
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Valor FOB Total (USD)</Label>
              <Input 
                value={`$${totalFobValue.toFixed(2)}`} 
                disabled 
                className="bg-gray-50"
              />
            </div>
            
            <div>
              <Label>Frete Internacional (USD)</Label>
              <Input 
                type="number"
                value={internationalFreight}
                onChange={(e) => setInternationalFreight(Number(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Seguro (USD)</Label>
              <Input 
                type="number"
                value={insurance}
                onChange={(e) => setInsurance(Number(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Taxa de Câmbio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Taxa USD → BRL</Label>
              <Input 
                type="number"
                step="0.01"
                value={usdToBrlRate}
                onChange={(e) => setUsdToBrlRate(Number(e.target.value) || 5.30)}
                placeholder="5.30"
              />
            </div>
          </div>

          {/* Seção expandível para valor FOB declarado */}
          <Collapsible open={showDeclaredValues} onOpenChange={setShowDeclaredValues}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-orange-600 hover:text-orange-700">
                {showDeclaredValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <AlertTriangle className="h-4 w-4" />
                Ajuste do Valor FOB Declarado
                {showDeclaredValues ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="space-y-3">
                <Label className="text-orange-800">Percentual do FOB a ser declarado (%)</Label>
                <Input 
                  type="number"
                  min="1"
                  max="100"
                  value={declaredFobAdjustment}
                  onChange={(e) => setDeclaredFobAdjustment(Number(e.target.value) || 100)}
                  className="w-32"
                />
                <div className="text-sm text-orange-700">
                  <p><strong>FOB Real:</strong> ${totalFobValue.toFixed(2)}</p>
                  <p><strong>FOB Declarado:</strong> ${declaredFobValue.toFixed(2)}</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* CIF Calculado */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-blue-800">Valor CIF (USD)</Label>
                <div className="text-2xl font-bold text-blue-600">
                  ${cifValue.toFixed(2)}
                </div>
                <div className="text-sm text-blue-700">
                  Baseado no Incoterm: {incoterm}
                </div>
              </div>
              <div>
                <Label className="text-purple-800">Valor CIF (BRL)</Label>
                <div className="text-2xl font-bold text-purple-600">
                  R$ {cifInBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-purple-700">
                  Taxa: R$ {usdToBrlRate.toFixed(2)} por USD
                </div>
              </div>
            </div>
          </div>

          {/* Custos customizados na categoria import_data */}
          {getCustomCostsByCategory('import_data').map(cost => (
            <div key={cost.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <span className="font-medium">{cost.name}</span>
                <span className="text-sm text-gray-600 ml-2">{cost.description}</span>
              </div>
              <div className="font-medium">
                {cost.currency} {calculateCustomCostValue(cost).toFixed(2)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Impostos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Impostos (% do CIF)
            <Dialog open={isAddCostOpen && newCost.category === 'taxes'} onOpenChange={setIsAddCostOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => setNewCost({...newCost, category: 'taxes'})}
                >
                  <Plus className="h-4 w-4" />
                  Add Custo
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {defaultTaxes.map((tax, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="destructive">{tax.percentage}%</Badge>
                  <span className="font-medium">{tax.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">
                    R$ {tax.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Impostos customizados */}
            {getCustomCostsByCategory('taxes').map(cost => (
              <div key={cost.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="destructive">
                    {cost.type === 'percentage' ? `${cost.percentage}%` : 'Fixo'}
                  </Badge>
                  <span className="font-medium">{cost.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">
                    {cost.currency} {calculateCustomCostValue(cost).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Taxas Fixas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Taxas e Tarifas
            <Dialog open={isAddCostOpen && newCost.category === 'fees'} onOpenChange={setIsAddCostOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => setNewCost({...newCost, category: 'fees'})}
                >
                  <Plus className="h-4 w-4" />
                  Add Custo
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {defaultFees.map((fee, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium">{fee.name}</span>
                <div className="text-right">
                  <div className="font-bold text-yellow-700">
                    {fee.currency} {fee.value.toFixed(2)}
                  </div>
                  {fee.currency === 'USD' && (
                    <div className="text-sm text-yellow-600">
                      ≈ R$ {(fee.value * usdToBrlRate).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Taxas customizadas */}
            {getCustomCostsByCategory('fees').map(cost => (
              <div key={cost.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium">{cost.name}</span>
                <div className="text-right font-bold text-yellow-700">
                  {cost.currency} {calculateCustomCostValue(cost).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Serviços */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Serviços
            <Dialog open={isAddCostOpen && newCost.category === 'services'} onOpenChange={setIsAddCostOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => setNewCost({...newCost, category: 'services'})}
                >
                  <Plus className="h-4 w-4" />
                  Add Custo
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {defaultServices.map((service, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">{service.name}</span>
                <div className="font-bold text-green-700">
                  R$ {service.value.toFixed(2)}
                </div>
              </div>
            ))}
            
            {/* Serviços customizados */}
            {getCustomCostsByCategory('services').map(cost => (
              <div key={cost.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">{cost.name}</span>
                <div className="font-bold text-green-700">
                  {cost.currency} {calculateCustomCostValue(cost).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resumo Final */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-indigo-800">Resumo da Importação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Valores Declarados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg border">
                <h4 className="font-semibold text-indigo-800 mb-3">Valores Declarados</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>CIF Declarado:</span>
                    <span>R$ {cifInBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impostos:</span>
                    <span>R$ {totalTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxas:</span>
                    <span>R$ {totalFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Serviços:</span>
                    <span>R$ {totalServices.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Declarado:</span>
                    <span>R$ {totalDeclaredImport.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg border">
                <h4 className="font-semibold text-indigo-800 mb-3">Breakdown USD</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>FOB Declarado:</span>
                    <span>${declaredFobValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frete Internacional:</span>
                    <span>${internationalFreight.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seguro:</span>
                    <span>${insurance.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>CIF Total:</span>
                    <span>${cifValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Valores Reais (expandível) */}
            <Collapsible open={showRealValues} onOpenChange={setShowRealValues}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-purple-600 hover:text-purple-700">
                  {showRealValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <AlertTriangle className="h-4 w-4" />
                  Ver Valores Reais para Fornecedor
                  {showRealValues ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-3">Pagamento ao Fornecedor</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>FOB Real:</span>
                        <span>${realFobValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Em Reais:</span>
                        <span>R$ {(realFobValue * usdToBrlRate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-3">Custo Real Total</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>CIF Real:</span>
                        <span>R$ {realCifInBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Custos Importação:</span>
                        <span>R$ {totalImportCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Real:</span>
                        <span>R$ {totalRealImport.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para adicionar custos */}
      <Dialog open={isAddCostOpen} onOpenChange={setIsAddCostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Custo Customizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do Custo</Label>
              <Input 
                value={newCost.name || ''}
                onChange={(e) => setNewCost({...newCost, name: e.target.value})}
                placeholder="Ex: Taxa especial"
              />
            </div>
            
            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea 
                value={newCost.description || ''}
                onChange={(e) => setNewCost({...newCost, description: e.target.value})}
                placeholder="Descrição do custo"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select 
                  value={newCost.category} 
                  onValueChange={(value) => setNewCost({...newCost, category: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="import_data">Dados de Importação</SelectItem>
                    <SelectItem value="taxes">Impostos</SelectItem>
                    <SelectItem value="fees">Taxas</SelectItem>
                    <SelectItem value="services">Serviços</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo</Label>
                <Select 
                  value={newCost.type} 
                  onValueChange={(value) => setNewCost({...newCost, type: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Valor Fixo</SelectItem>
                    <SelectItem value="percentage">Percentual do CIF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  {newCost.type === 'percentage' ? 'Percentual (%)' : 'Valor'}
                </Label>
                <Input 
                  type="number"
                  step={newCost.type === 'percentage' ? '0.01' : '0.01'}
                  value={newCost.value || ''}
                  onChange={(e) => setNewCost({...newCost, value: Number(e.target.value) || 0})}
                  placeholder={newCost.type === 'percentage' ? '2.5' : '100.00'}
                />
              </div>

              <div>
                <Label>Moeda</Label>
                <Select 
                  value={newCost.currency} 
                  onValueChange={(value) => setNewCost({...newCost, currency: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">BRL (R$)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddCostOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={addCustomCost}>
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}