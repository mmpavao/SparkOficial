import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Package, Weight, Ruler, Hash } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Product } from '@shared/imports-schema';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ProductForm } from '@/components/products/ProductForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function ProductsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/products'],
    enabled: !!user,
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      return await apiRequest(`/api/products/${productId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Produto deletado',
        description: 'O produto foi removido com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar o produto.',
        variant: 'destructive',
      });
    },
  });

  // Filter products based on search and category
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.ncmCode.includes(searchTerm) ||
                         (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory && product.isActive;
  });

  // Get unique categories for filter
  const categories = [...new Set(products.map((p: Product) => p.category).filter(Boolean))];

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = (productId: number) => {
    if (confirm('Tem certeza que deseja deletar este produto?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    queryClient.invalidateQueries({ queryKey: ['/api/products'] });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de Produtos</h1>
          <p className="text-gray-600">Gerencie seus produtos para importação</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProduct(null)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
            </DialogHeader>
            <ProductForm
              product={editingProduct}
              onSuccess={handleFormSuccess}
              onCancel={handleFormClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Produtos Ativos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter((p: Product) => p.isActive).length}
                </p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categorias</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
              <Hash className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Com NCM</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter((p: Product) => p.ncmCode).length}
                </p>
              </div>
              <Hash className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, NCM ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
                size="sm"
              >
                Todas
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  size="sm"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedCategory !== 'all' ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece cadastrando seu primeiro produto para importação.'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Produto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product: Product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{product.productName}</CardTitle>
                    <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Category and NCM */}
                  <div className="flex flex-wrap gap-2">
                    {product.category && (
                      <Badge variant="secondary">{product.category}</Badge>
                    )}
                    {product.ncmCode && (
                      <Badge variant="outline">NCM: {product.ncmCode}</Badge>
                    )}
                  </div>

                  {/* Physical specs */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Weight className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-600">Peso:</span>
                      <span className="font-medium">{Number(product.weight)}kg</span>
                    </div>
                    
                    {(product.length && product.width && product.height) && (
                      <div className="flex items-center gap-1">
                        <Ruler className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-600">Dim:</span>
                        <span className="font-medium text-xs">
                          {Number(product.length)}×{Number(product.width)}×{Number(product.height)}cm
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Unidade:</span>
                      <span className="font-medium">{product.unitOfMeasure}</span>
                    </div>
                    
                    {product.material && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">Material:</span>
                        <span className="font-medium text-xs">{product.material}</span>
                      </div>
                    )}
                  </div>

                  {/* Additional info */}
                  {(product.brand || product.productOrigin) && (
                    <div className="pt-2 border-t text-xs text-gray-600">
                      {product.brand && <div>Marca: {product.brand}</div>}
                      {product.productOrigin && <div>Origem: {product.productOrigin}</div>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}