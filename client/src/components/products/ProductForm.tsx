import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { insertProductSchema, type Product, type InsertProduct } from '@shared/imports-schema';
import { apiRequest } from '@/lib/queryClient';
import { ObjectUploader } from '@/components/ObjectUploader';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const UNIT_OPTIONS = [
  { value: 'PCS', label: 'Peças (PCS)' },
  { value: 'KG', label: 'Quilogramas (KG)' },
  { value: 'M', label: 'Metros (M)' },
  { value: 'M2', label: 'Metros Quadrados (M²)' },
  { value: 'M3', label: 'Metros Cúbicos (M³)' },
  { value: 'L', label: 'Litros (L)' },
  { value: 'SET', label: 'Conjuntos (SET)' },
  { value: 'PAR', label: 'Pares (PAR)' },
  { value: 'CX', label: 'Caixas (CX)' },
  { value: 'PCT', label: 'Pacotes (PCT)' },
];

const MATERIAL_OPTIONS = [
  'Plástico', 'Metal', 'Madeira', 'Vidro', 'Cerâmica', 'Tecido', 'Couro',
  'Borracha', 'Papel', 'Eletrônico', 'Químico', 'Alimentício', 'Outro'
];

const PACKAGING_OPTIONS = [
  'Caixa de Papelão', 'Caixa de Madeira', 'Pallet', 'Sacaria', 'Contêiner',
  'Bobina', 'Tambor', 'Fardo', 'Granel', 'Embalagem Individual'
];

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageUrl, setImageUrl] = useState<string>(product?.imageUrl || '');

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      productName: product?.productName || '',
      description: product?.description || '',
      category: product?.category || '',
      subCategory: product?.subCategory || '',
      ncmCode: product?.ncmCode || '',
      hsCode: product?.hsCode || '',
      productOrigin: product?.productOrigin || 'China',
      weight: product?.weight ? Number(product.weight) : 0,
      length: product?.length ? Number(product.length) : undefined,
      width: product?.width ? Number(product.width) : undefined,
      height: product?.height ? Number(product.height) : undefined,
      material: product?.material || '',
      composition: product?.composition || '',
      brand: product?.brand || '',
      model: product?.model || '',
      packagingType: product?.packagingType || '',
      unitsPerPackage: product?.unitsPerPackage || 1,
      packageWeight: product?.packageWeight ? Number(product.packageWeight) : undefined,
      packageDimensions: product?.packageDimensions || '',
      dangerousGoods: product?.dangerousGoods || false,
      requiresSpecialHandling: product?.requiresSpecialHandling || false,
      certifications: product?.certifications || [],
      restrictions: product?.restrictions || '',
      unitOfMeasure: product?.unitOfMeasure || 'PCS',
      minimumOrderQuantity: product?.minimumOrderQuantity || 1,
      standardPackSize: product?.standardPackSize || 1,
      unitPrice: product?.unitPrice ? Number(product.unitPrice) : undefined,
      currency: product?.currency || 'USD',
      estimatedImportTax: product?.estimatedImportTax || undefined,
      estimatedIpi: product?.estimatedIpi || undefined,
      estimatedPis: product?.estimatedPis || undefined,
      estimatedCofins: product?.estimatedCofins || undefined,
      estimatedIcms: product?.estimatedIcms || undefined,
      notes: product?.notes || '',
      isActive: product?.isActive ?? true,
      imageUrl: product?.imageUrl || '',
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const url = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';
      return await apiRequest(url, method, data);
    },
    onSuccess: () => {
      toast({
        title: product ? 'Produto atualizado' : 'Produto criado',
        description: product 
          ? 'O produto foi atualizado com sucesso.' 
          : 'Novo produto foi adicionado ao catálogo.',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o produto.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: InsertProduct) => {
    // Calculate volume if dimensions are provided
    if (data.length && data.width && data.height) {
      data.volume = (data.length * data.width * data.height) / 1000000; // Convert cm³ to m³
    }

    // Include the uploaded image URL
    if (imageUrl) {
      data.imageUrl = imageUrl;
    }

    createProductMutation.mutate(data);
  };

  const handleImageUpload = async () => {
    try {
      const response = await apiRequest('/api/objects/upload', 'POST');
      return {
        method: 'PUT' as const,
        url: response.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload URL:', error);
      throw error;
    }
  };

  const handleUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const imageUrl = uploadedFile.uploadURL.split('?')[0]; // Remove query parameters
      setImageUrl(imageUrl);
      form.setValue('imageUrl', imageUrl);
      
      toast({
        title: 'Imagem enviada',
        description: 'A imagem do produto foi enviada com sucesso.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Smartphone Android" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Samsung" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição detalhada do produto..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                <span className="font-medium">Imagem do Produto</span>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-1">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5242880} // 5MB
                    onGetUploadParameters={handleImageUpload}
                    onComplete={handleUploadComplete}
                    buttonClassName="w-full md:w-auto"
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      <span>Enviar Imagem</span>
                    </div>
                  </ObjectUploader>
                  <p className="text-sm text-muted-foreground mt-2">
                    Formatos suportados: JPG, PNG, WebP. Tamanho máximo: 5MB
                  </p>
                </div>
                
                {imageUrl && (
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 border rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={imageUrl} 
                        alt="Preview do produto" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => {
                        setImageUrl('');
                        form.setValue('imageUrl', '');
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Eletrônicos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Smartphones" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Galaxy S24" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Classification and Customs */}
        <Card>
          <CardHeader>
            <CardTitle>Classificação Fiscal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="ncmCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código NCM *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 85171200" 
                        {...field}
                        maxLength={10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hsCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código HS</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 851712" 
                        {...field}
                        maxLength={6}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productOrigin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País de Origem</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: China" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Physical Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Especificações Físicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso Unitário (kg) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.001"
                        placeholder="Ex: 0.180" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitOfMeasure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de Medida *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIT_OPTIONS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comprimento (cm)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="Ex: 15.5" 
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Largura (cm)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="Ex: 7.8" 
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Altura (cm)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="Ex: 0.8" 
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Material and Composition */}
        <Card>
          <CardHeader>
            <CardTitle>Material e Composição</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="material"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Principal</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o material" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MATERIAL_OPTIONS.map((material) => (
                          <SelectItem key={material} value={material}>
                            {material}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="packagingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Embalagem</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a embalagem" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PACKAGING_OPTIONS.map((packaging) => (
                          <SelectItem key={packaging} value={packaging}>
                            {packaging}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="composition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Composição Detalhada</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva a composição detalhada do produto..."
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Commercial Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Comerciais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="minimumOrderQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Mínima</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Ex: 100" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="standardPackSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanho do Pacote</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Ex: 50" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitsPerPackage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidades por Embalagem</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Ex: 1" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pricing Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Unitário</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="Ex: 25.50" 
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moeda</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a moeda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                        <SelectItem value="CNY">CNY - Yuan Chinês</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="BRL">BRL - Real Brasileiro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Safety and Compliance */}
        <Card>
          <CardHeader>
            <CardTitle>Segurança e Conformidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-8">
              <FormField
                control={form.control}
                name="dangerousGoods"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Mercadoria Perigosa</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requiresSpecialHandling"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Requer Manuseio Especial</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Produto Ativo</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="restrictions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restrições de Importação</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva quaisquer restrições conhecidas..."
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Observações Adicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais sobre o produto..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={createProductMutation.isPending}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={createProductMutation.isPending}
            className="min-w-24"
          >
            {createProductMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              product ? 'Atualizar' : 'Criar Produto'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}