import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Package, Weight, Ruler, Hash, Grid3X3, List } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Product } from '@shared/imports-schema';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { ProductForm } from '@/components/products/ProductForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function ProductsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
        title: t("products.productDeleted"),
        description: t("products.productDeletedDesc"),
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: t("products.cannotDeleteProduct"),
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
    if (confirm(t("products.deleteConfirmation"))) {
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
          <h1 className="text-3xl font-bold text-gray-900">{t("products.title")}</h1>
          <p className="text-gray-600">{t("products.subtitle")}</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProduct(null)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t("products.newProduct")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? t("products.editProduct") : t("products.newProduct")}
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
                <p className="text-sm font-medium text-gray-600">{t("products.categories")}</p>
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
                <p className="text-sm font-medium text-gray-600">{t("products.withNCM")}</p>
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
                placeholder={t("products.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('all')}
                  size="sm"
                >
                  {t("products.allCategories")}
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
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedCategory !== 'all' ? t("products.noProductsFound") : t("products.noProductsRegistered")}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? t("products.adjustFilters") 
                : t("products.startRegistering")
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t("products.registerProduct")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product: Product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
              {/* Product Image */}
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                {(product as any).imageUrl ? (
                  <img 
                    src={(product as any).imageUrl} 
                    alt={product.productName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      const placeholder = target.parentElement?.querySelector('.placeholder-icon') as HTMLElement;
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                ) : null}
                
                <div 
                  className="placeholder-icon absolute inset-0 flex items-center justify-center bg-gray-100" 
                  style={{ display: (product as any).imageUrl ? 'none' : 'flex' }}
                >
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
                
                {/* Category Badge */}
                {product.category && (
                  <Badge className="absolute top-3 left-3 bg-white/90 text-gray-800 hover:bg-white shadow-sm">
                    {product.category}
                  </Badge>
                )}

                {/* Action Buttons Overlay */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEdit(product)}
                    className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDelete(product.id)}
                    className="h-8 w-8 p-0 bg-white/90 hover:bg-red-50 text-red-600 hover:text-red-700 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <CardContent className="p-4">
                {/* Product Name & Description */}
                <div className="mb-3">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1">
                    {product.productName}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {product.description || t("products.noDescription")}
                  </p>
                </div>

                {/* NCM Code */}
                {product.ncmCode && (
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Hash className="h-4 w-4 mr-2" />
                    <span>{t("products.ncm")}: {product.ncmCode}</span>
                  </div>
                )}

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  {product.weight && (
                    <div className="flex items-center">
                      <Weight className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <span className="text-gray-500">{t("products.weight")}</span>
                        <p className="font-medium">{parseFloat(product.weight).toFixed(2)} kg</p>
                      </div>
                    </div>
                  )}
                  
                  {product.unitOfMeasure && (
                    <div>
                      <span className="text-gray-500">Unidade</span>
                      <p className="font-medium">{product.unitOfMeasure}</p>
                    </div>
                  )}

                  {product.material && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Material</span>
                      <p className="font-medium">{product.material}</p>
                    </div>
                  )}
                </div>

                {/* Price */}
                {product.unitPrice && (
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Preço unitário</span>
                      <span className="text-lg font-bold text-emerald-600">
                        {product.currency || 'USD'} {parseFloat(product.unitPrice).toLocaleString('pt-BR', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Brand & Origin */}
                {(product.brand || product.productOrigin) && (
                  <div className="mt-3 pt-3 border-t text-xs text-gray-500 space-y-1">
                    {product.brand && <div>Marca: {product.brand}</div>}
                    {product.productOrigin && <div>Origem: {product.productOrigin}</div>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("products.product")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("products.ncm")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("products.category")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("products.weightKg")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("products.price")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("products.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product: Product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 mr-4">
                          {(product as any).imageUrl ? (
                            <img 
                              src={(product as any).imageUrl} 
                              alt={product.productName}
                              className="h-10 w-10 rounded object-cover"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.display = 'none';
                                const placeholder = target.parentElement?.querySelector('.placeholder-icon') as HTMLElement;
                                if (placeholder) placeholder.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="placeholder-icon h-10 w-10 bg-gray-100 rounded flex items-center justify-center" 
                            style={{ display: (product as any).imageUrl ? 'none' : 'flex' }}
                          >
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.productName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.description || t("products.noDescription")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Hash className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{product.ncmCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary">
                        {product.category || t("products.noCategory")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Weight className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {product.weight ? parseFloat(product.weight).toFixed(2) : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.unitPrice 
                          ? `${product.currency || 'USD'} ${parseFloat(product.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : 'N/A'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}