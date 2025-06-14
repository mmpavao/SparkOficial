# Templates Obrigatórios - Componentes Spark Comex

## Template Base para Componentes

### 1. Componente Básico com I18n

```typescript
/**
 * [NomeDoComponente] - Descrição
 * ✅ Padronizado com internacionalização
 */
import { useTranslation } from "@/contexts/I18nContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface [NomeDoComponente]Props {
  // Props tipadas
}

export default function [NomeDoComponente]({ }: [NomeDoComponente]Props) {
  const { t } = useTranslation();

  return (
    <Card data-component="[nome-do-componente]">
      <CardHeader>
        <CardTitle>{t.categoria.titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{t.categoria.descricao}</p>
      </CardContent>
    </Card>
  );
}
```

### 2. Página Completa com I18n

```typescript
/**
 * [NomeDaPagina] Page
 * ✅ Padronizada com internacionalização completa
 */
import { useTranslation } from "@/contexts/I18nContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function [NomeDaPagina]Page() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="space-y-6" data-component="[nome-da-pagina]">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t.categoria.title}</h1>
        <p className="text-gray-600">{t.categoria.description}</p>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conteúdo usando t.categoria.chave */}
      </div>
    </div>
  );
}
```

### 3. Formulário com I18n e Validação

```typescript
/**
 * [NomeDoFormulario] Form
 * ✅ Formulário padronizado com validação internacional
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "@/contexts/I18nContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

const formSchema = z.object({
  campo: z.string().min(1, "Campo obrigatório"),
});

type FormData = z.infer<typeof formSchema>;

export default function [NomeDoFormulario]Form() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      campo: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // API call
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: t.common.success,
        description: t.categoria.successMessage,
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="campo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.categoria.fieldLabel}</FormLabel>
              <FormControl>
                <Input placeholder={t.categoria.placeholder} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? t.common.loading : t.common.save}
        </Button>
      </form>
    </Form>
  );
}
```

### 4. Modal/Dialog com I18n

```typescript
/**
 * [NomeDoModal] Modal
 * ✅ Modal padronizado com internacionalização
 */
import { useTranslation } from "@/contexts/I18nContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface [NomeDoModal]Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function [NomeDoModal]({ isOpen, onClose }: [NomeDoModal]Props) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.categoria.modalTitle}</DialogTitle>
          <DialogDescription>
            {t.categoria.modalDescription}
          </DialogDescription>
        </DialogHeader>
        
        {/* Conteúdo do modal usando traduções */}
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button>
            {t.common.confirm}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Checklist de Desenvolvimento

### Antes de Criar Componente
- [ ] Definir categoria de tradução (nav, dashboard, admin, etc.)
- [ ] Listar todas as strings necessárias
- [ ] Verificar se strings já existem no sistema

### Durante o Desenvolvimento
- [ ] Importar `useTranslation` em TODOS os componentes
- [ ] Usar `t.categoria.chave` para TODOS os textos
- [ ] Adicionar `data-component` para validação
- [ ] Testar em pelo menos 2 idiomas

### Antes do Commit
- [ ] Verificar se adicionou strings nos 4 idiomas
- [ ] Atualizar interface TypeScript
- [ ] Nenhum texto hardcoded presente
- [ ] Testado em PT e EN no mínimo

## Strings Comuns Já Disponíveis

### Botões e Ações
```typescript
{t.common.save}        // Salvar/Save/保存/Guardar
{t.common.cancel}      // Cancelar/Cancel/取消/Cancelar
{t.common.edit}        // Editar/Edit/编辑/Editar
{t.common.delete}      // Excluir/Delete/删除/Eliminar
{t.common.create}      // Criar/Create/创建/Crear
{t.common.update}      // Atualizar/Update/更新/Actualizar
{t.common.loading}     // Carregando.../Loading.../加载中.../Cargando...
```

### Estados
```typescript
{t.common.active}      // Ativo/Active/活跃/Activo
{t.common.inactive}    // Inativo/Inactive/未激活/Inactivo
{t.common.pending}     // Pendente/Pending/待处理/Pendiente
{t.common.approved}    // Aprovado/Approved/已批准/Aprobado
{t.common.rejected}    // Rejeitado/Rejected/已拒绝/Rechazado
```

### Navegação
```typescript
{t.nav.dashboard}      // Dashboard/Dashboard/仪表板/Panel
{t.nav.credit}         // Crédito/Credit/信贷/Crédito
{t.nav.imports}        // Importações/Imports/进口/Importaciones
{t.nav.reports}        // Relatórios/Reports/报告/Informes
{t.nav.settings}       // Configurações/Settings/设置/Configuración
```

## Regras de Nomenclatura

### Categorias
- Use categorias existentes sempre que possível
- Novas categorias em camelCase: `newCategory`
- Mantenha hierarquia lógica: `category.subcategory.item`

### Chaves
- camelCase obrigatório: `myNewKey`
- Descritivas: `submitButton` não `btn1`
- Consistentes: `userName` não `user_name`

## Enforcement Automático

Este sistema garante que:
1. Todo componente novo seguirá o padrão
2. Nenhum texto hardcoded será commitado
3. Todas as 4 traduções estarão presentes
4. Qualidade consistente em toda aplicação

Use estes templates como base obrigatória para todo desenvolvimento futuro no Spark Comex.