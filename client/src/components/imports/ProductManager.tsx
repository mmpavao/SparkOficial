import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Package, DollarSign, Search, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface Product {
  productId?: number; // ID do produto master cadastrado
  productName: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  supplierId?: number;
  // Campos opcionais do produto master
  ncmCode?: string;
  hsCode?: string;
  description?: string;
  weight?: number;
}

interface ProductManagerProps {
  products: Product[];
  suppliers: any[];
  onProductsChange: (products: Product[]) => void;
}

export function ProductManager({ products, suppliers, onProductsChange }: ProductManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedMasterProduct, setSelectedMasterProduct] = useState<any>(null);
  
  // Buscar produtos cadastrados no sistema
  const { data: masterProducts = [] } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Erro ao buscar produtos');
      return response.json();
    }
  });

  const addProductFromMaster = (masterProduct: any) => {
    const newProduct: Product = {
      productId: masterProduct.id,
      productName: masterProduct.productName,
      quantity: 1,
      unitPrice: 0,
      totalValue: 0,
      supplierId: undefined,
      ncmCode: masterProduct.ncmCode,
      hsCode: masterProduct.hsCode,
      description: masterProduct.description,
      weight: masterProduct.weight
    };
    onProductsChange([...products, newProduct]);
    setEditingIndex(products.length);
    setSelectedMasterProduct(null);
  };
  
  const addNewProduct = () => {
    const newProduct: Product = {
      productName: "",
      quantity: 1,
      unitPrice: 0,
      totalValue: 0,
      supplierId: undefined
    };
    onProductsChange([...products, newProduct]);
    setEditingIndex(products.length);
  };

  const removeProduct = (index: number) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    onProductsChange(updatedProducts);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const updateProduct = (index: number, field: keyof Product, value: any) => {
    const updatedProducts = [...products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    
    // Recalculate total value when quantity or unitPrice changes
    if (field === 'quantity' || field === 'unitPrice') {
      updatedProducts[index].totalValue = updatedProducts[index].quantity * updatedProducts[index].unitPrice;
    }
    
    onProductsChange(updatedProducts);
  };

  const getTotalValue = () => {
    return products.reduce((sum, product) => sum + product.totalValue, 0);
  };

  const getTotalQuantity = () => {
    return products.reduce((sum, product) => sum + product.quantity, 0);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      {products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Quantidade Total</p>
                  <p className="text-2xl font-bold">{getTotalQuantity()}</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(getTotalValue(), 'USD')}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Product Section */}
      <Card className="border-dashed border-2 border-gray-200">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div>
                <Label htmlFor="master-product-select">Selecionar Produto Cadastrado</Label>
                <Select value={selectedMasterProduct?.id?.toString() || "new-product"} onValueChange={(value) => {
                  if (value === "new-product") {
                    setSelectedMasterProduct(null);
                  } else {
                    const product = masterProducts.find((p: any) => p.id.toString() === value);
                    setSelectedMasterProduct(product);
                  }
                }}>
                  <SelectTrigger className="w-80">
                    <SelectValue placeholder="Escolha um produto ou crie novo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new-product">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Criar Produto Novo
                      </div>
                    </SelectItem>
                    {masterProducts.map((product: any, index: number) => (
                      <SelectItem key={product.id || index} value={product.id?.toString() || `product-${index}`}>
                        <div className="flex flex-col text-left">
                          <span className="font-medium">{product.productName}</span>
                          <span className="text-xs text-gray-500">
                            NCM: {product.ncmCode} | {product.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={() => {
                  if (selectedMasterProduct) {
                    addProductFromMaster(selectedMasterProduct);
                  } else {
                    addNewProduct();
                  }
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {selectedMasterProduct ? 'Adicionar Produto' : 'Criar Produto Novo'}
              </Button>
            </div>
            
            {selectedMasterProduct && (
              <div className="bg-blue-50 p-4 rounded-lg text-left">
                <h4 className="font-medium text-blue-900 mb-2">Produto Selecionado:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Nome:</strong> {selectedMasterProduct.productName}</div>
                  <div><strong>NCM:</strong> {selectedMasterProduct.ncmCode}</div>
                  <div><strong>Descrição:</strong> {selectedMasterProduct.description}</div>
                  <div><strong>Peso:</strong> {selectedMasterProduct.weight}kg</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <div className="space-y-4">
        {products.map((product, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Produto {index + 1}
                  {product.productName && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      - {product.productName}
                    </span>
                  )}
                  {product.productId && (
                    <Badge variant="secondary" className="ml-2">
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Cadastrado
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {formatCurrency(product.totalValue, 'USD')}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                  >
                    {editingIndex === index ? 'Concluir' : 'Editar'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProduct(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {editingIndex === index ? (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`productName-${index}`}>Nome do Produto *</Label>
                    <Input
                      id={`productName-${index}`}
                      value={product.productName}
                      onChange={(e) => updateProduct(index, 'productName', e.target.value)}
                      placeholder="Ex: Smartphone Samsung Galaxy"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`supplier-${index}`}>Fornecedor</Label>
                    <Select
                      value={product.supplierId?.toString() || "no-supplier"}
                      onValueChange={(value) => updateProduct(index, 'supplierId', value === "no-supplier" ? undefined : parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-supplier">Nenhum fornecedor</SelectItem>
                        {suppliers.map((supplier: any, index: number) => (
                          <SelectItem key={supplier.id || index} value={supplier.id?.toString() || `supplier-${index}`}>
                            {supplier.companyName || 'Fornecedor sem nome'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`quantity-${index}`}>Quantidade *</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`unitPrice-${index}`}>Preço Unitário (USD) *</Label>
                    <Input
                      id={`unitPrice-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={product.unitPrice}
                      onChange={(e) => updateProduct(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Valor Total:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(product.totalValue, 'USD')}
                    </span>
                  </div>
                </div>
              </CardContent>
            ) : (
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Quantidade:</span>
                    <p className="font-medium">{product.quantity}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Preço Unit.:</span>
                    <p className="font-medium">{formatCurrency(product.unitPrice, 'USD')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <p className="font-medium text-green-600">{formatCurrency(product.totalValue, 'USD')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Fornecedor:</span>
                    <p className="font-medium">
                      {product.supplierId 
                        ? suppliers.find(s => s.id === product.supplierId)?.companyName || 'N/A'
                        : 'Não especificado'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {/* Add Product Button */}
        <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Use a seção acima para adicionar produtos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Messages */}
      {products.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-medium">Nenhum produto adicionado</p>
          <p className="text-sm">Para carga LCL, adicione pelo menos um produto</p>
        </div>
      )}

      {products.some(p => !p.productName.trim()) && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            ⚠️ Alguns produtos não possuem nome. Preencha todos os campos obrigatórios.
          </p>
        </div>
      )}
    </div>
  );
}