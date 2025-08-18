import { useState, useEffect } from "react";
import { useParams, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Package,
  Ship,
  MapPin,
  DollarSign,
  FileText,
  Building2,
  Plus,
  Trash2,
  Edit3
} from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function ImportEditOperationalPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useRoute();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Schema de validação simplificado para importação operacional
  const operationalImportSchema = z.object({
    importName: z.string().min(1, t("validation.importNameRequired")),
    cargoType: z.string().min(1, t("validation.cargoTypeRequired")),
    totalValue: z.string().min(1, t("validation.totalValueRequired")),
    currency: z.string().min(1, t("validation.currencyRequired")),
    incoterms: z.string().min(1, t("validation.incotermsRequired")),
    // Campos opcionais
    containerNumber: z.string().optional(),
    sealNumber: z.string().optional(),
    weight: z.string().optional(),
    volume: z.string().optional(),
    transportMethod: z.string().optional(),
    origin: z.string().optional(),
    destination: z.string().optional(),
    notes: z.string().optional(),
  });

  type OperationalImportForm = z.infer<typeof operationalImportSchema>;
  
  // Fetch import data
  const { data: importData, isLoading: isLoadingImport, error } = useQuery({
    queryKey: [`/api/imports/operational/${id}`],
    enabled: !!id,
  });


  const form = useForm<OperationalImportForm>({
    resolver: zodResolver(operationalImportSchema),
    defaultValues: {
      importName: "",
      cargoType: "FCL",
      totalValue: "",
      currency: "USD",
      incoterms: "FOB",
      containerNumber: "",
      sealNumber: "",
      weight: "",
      volume: "",
      transportMethod: "maritimo",
      origin: "",
      destination: "",
      notes: "",
    },
  });

  // Update form when import data is loaded
  useEffect(() => {
    if (importData && importData.fullData) {
      const data = importData.fullData;
      
      form.reset({
        importName: data.importName || "",
        cargoType: data.cargoType || "FCL",
        totalValue: data.totalValue?.toString() || "",
        currency: data.currency || "USD",
        incoterms: data.incoterms || "FOB",
        containerNumber: data.containerNumber || "",
        sealNumber: data.sealNumber || "",
        weight: data.weight?.toString() || "",
        volume: data.volume?.toString() || "",
        transportMethod: data.transportMethod || "maritimo",
        origin: data.portOfLoading || "",
        destination: data.portOfDischarge || "",
        notes: data.notes || "",
      });
    }
  }, [importData, form]);

  // Update mutation
  const updateImportMutation = useMutation({
    mutationFn: async (data: OperationalImportForm) => {
      return apiRequest(`/api/imports/operational/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("imports.importUpdatedSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/imports/operational/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/imports'] });
      navigate("/imports");
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("imports.updateError"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OperationalImportForm) => {
    updateImportMutation.mutate(data);
  };

  if (isLoadingImport) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t("imports.loadingImportData")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">{t("imports.loadError")}</h2>
          <p className="text-muted-foreground mb-4">
            {t("imports.loadErrorDesc")}
          </p>
          <Button asChild>
            <Link href="/imports">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("imports.backToImports")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!importData || !importData.fullData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">{t("imports.notFound")}</h2>
          <p className="text-muted-foreground mb-4">
            {t("imports.notFoundDesc")}
          </p>
          <Button asChild>
            <Link href="/imports">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("imports.backToImports")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/imports">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t("imports.editOperationalImport")}</h1>
            <p className="text-muted-foreground">
              {t("imports.editOperationalImportDesc")}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          {t("imports.operational")}
        </Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t("imports.basicInformation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="importName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("imports.importName")} *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('placeholders.importNameExample')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cargoType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("imports.cargoType")} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('select.chooseType')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FCL">{t("cargo.fclContainer")}</SelectItem>
                          <SelectItem value="LCL">{t("cargo.lclConsolidated")}</SelectItem>
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
                  name="totalValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("imports.totalValue")} *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder={t('placeholders.weight')} />
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
                      <FormLabel>{t("imports.currency")} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="BRL">BRL</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="CNY">CNY</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="incoterms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("imports.incoterms")} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FOB">FOB</SelectItem>
                          <SelectItem value="CIF">CIF</SelectItem>
                          <SelectItem value="EXW">EXW</SelectItem>
                          <SelectItem value="DDP">DDP</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Detalhes do Container */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5" />
                {t("imports.containerDetails")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="containerNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("imports.containerNumber")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('placeholders.containerNumber')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sealNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("imports.sealNumber")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('placeholders.sealNumber')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("products.weightKg")}</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder={t('placeholders.weight')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="volume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("imports.volumeM3")}</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder={t('placeholders.volume')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="transportMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("imports.transportMethod")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="maritimo">{t("imports.maritime")}</SelectItem>
                          <SelectItem value="aereo">{t("imports.air")}</SelectItem>
                          <SelectItem value="rodoviario">{t("imports.land")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t("imports.originAndDestination")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("imports.portOfLoading")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('placeholders.portOfLoading')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("imports.portOfDischarge")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('placeholders.portOfDischarge')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle>{t("imports.observations")}</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("imports.internalNotes")}</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder={t('placeholders.importNotes')}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" type="button" asChild>
              <Link href="/imports">{t("common.cancel")}</Link>
            </Button>
            <Button 
              type="submit" 
              disabled={updateImportMutation.isPending}
              className="flex items-center gap-2"
            >
              {updateImportMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {updateImportMutation.isPending ? t("common.saving") : t("imports.saveChanges")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}