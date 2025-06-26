import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Package, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { Supplier } from "@shared/schema";

interface Product {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  supplierId?: number;
  description?: string;
}

interface ProductManagerProps {
  products: Product[];
  onProductsChange: (products: Product[]) => void;
  suppliers: Supplier[];
  currency: string;
}

export default function ProductManager({ 
  products, 
  onProductsChange, 
  suppliers, 
  currency 
}: ProductManagerProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const addNewProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name: "",
      quantity: 1,
      unitPrice: 0,
      description: "",
    };
    setEditingProduct(newProduct);
    setIsAddingNew(true);
  };

  const saveProduct = (product: Product) => {
    if (isAddingNew) {
      onProductsChange([...products, product]);
      setIsAddingNew(false);
    } else {
      onProductsChange(products.map(p => p.id === product.id ? product : p));
    }
    setEditingProduct(null);
  };

  const deleteProduct = (productId: string) => {
    onProductsChange(products.filter(p => p.id !== productId));
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setIsAddingNew(false);
  };

  const totalValue = products.reduce((sum, product) => sum + (product.quantity * product.unitPrice), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Produtos (LCL)
          </CardTitle>
          <Button onClick={addNewProduct} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Products List */}
        {products.length === 0 && !editingProduct && (
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription>
              Nenhum produto adicionado. Clique em "Adicionar Produto" para começar.
            </AlertDescription>
          </Alert>
        )}

        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            suppliers={suppliers}
            currency={currency}
            isEditing={editingProduct?.id === product.id}
            onEdit={setEditingProduct}
            onSave={saveProduct}
            onDelete={deleteProduct}
            onCancel={cancelEdit}
          />
        ))}

        {/* Add/Edit Product Form */}
        {editingProduct && (
          <ProductForm
            product={editingProduct}
            suppliers={suppliers}
            currency={currency}
            onSave={saveProduct}
            onCancel={cancelEdit}
            isNew={isAddingNew}
          />
        )}

        {/* Summary */}
        {products.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <span className="font-medium text-blue-800">Total da Carga</span>
                  <p className="text-sm text-blue-600">{products.length} produto(s)</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">
                  {formatCurrency(totalValue, currency)}
                </div>
                <div className="text-sm text-blue-600">
                  Valor total calculado
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ProductCardProps {
  product: Product;
  suppliers: Supplier[];
  currency: string;
  isEditing: boolean;
  onEdit: (product: Product) => void;
  onSave: (product: Product) => void;
  onDelete: (productId: string) => void;
  onCancel: () => void;
}

function ProductCard({ 
  product, 
  suppliers, 
  currency, 
  isEditing, 
  onEdit, 
  onSave, 
  onDelete, 
  onCancel 
}: ProductCardProps) {
  if (isEditing) {
    return (
      <ProductForm
        product={product}
        suppliers={suppliers}
        currency={currency}
        onSave={onSave}
        onCancel={onCancel}
        isNew={false}
      />
    );
  }

  const supplier = suppliers.find(s => s.id === product.supplierId);
  const totalValue = product.quantity * product.unitPrice;

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold text-lg">{product.name}</h4>
            <Badge variant="outline" className="text-xs">
              {product.quantity}x {formatCurrency(product.unitPrice, currency)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
            <div>
              <span className="font-medium">Quantidade:</span> {product.quantity}
            </div>
            <div>
              <span className="font-medium">Preço unitário:</span> {formatCurrency(product.unitPrice, currency)}
            </div>
          </div>

          {supplier && (
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Fornecedor:</span> {supplier.companyName}
            </div>
          )}

          {product.description && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Descrição:</span> {product.description}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(totalValue, currency)}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(product)}
            >
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(product.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProductFormProps {
  product: Product;
  suppliers: Supplier[];
  currency: string;
  onSave: (product: Product) => void;
  onCancel: () => void;
  isNew: boolean;
}

function ProductForm({ 
  product, 
  suppliers, 
  currency, 
  onSave, 
  onCancel, 
  isNew 
}: ProductFormProps) {
  const [formData, setFormData] = useState<Product>(product);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.quantity > 0 && formData.unitPrice > 0) {
      onSave(formData);
    }
  };

  const updateField = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="productName">Nome do Produto *</Label>
          <Input
            id="productName"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Ex: Smartphone XYZ"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier">Fornecedor</Label>
          <Select 
            value={formData.supplierId?.toString() || ""} 
            onValueChange={(value) => updateField('supplierId', value ? parseInt(value) : undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um fornecedor" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                  {supplier.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade *</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => updateField('quantity', parseInt(e.target.value) || 1)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitPrice">Preço Unitário ({currency}) *</Label>
          <Input
            id="unitPrice"
            type="number"
            step="0.01"
            min="0"
            value={formData.unitPrice}
            onChange={(e) => updateField('unitPrice', parseFloat(e.target.value) || 0)}
            required
          />
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Descrição detalhada do produto..."
          rows={2}
        />
      </div>

      {/* Preview Total */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-blue-800">Total deste produto:</span>
          <span className="text-lg font-bold text-blue-900">
            {formatCurrency(formData.quantity * formData.unitPrice, currency)}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="bg-green-600 hover:bg-green-700">
          {isNew ? 'Adicionar' : 'Salvar'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}