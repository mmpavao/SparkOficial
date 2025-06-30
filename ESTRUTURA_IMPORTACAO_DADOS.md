# Estrutura para Importação de Dados - Spark Comex

## 1. Tabela de Importadores (users)

### Estrutura CSV/Excel:
```csv
company_name,cnpj,full_name,phone,email,password,role,status
"Empresa Exemplo LTDA","12.345.678/0001-90","João da Silva","(11) 99999-9999","joao@empresa.com","senha123","importer","active"
```

### Campos Obrigatórios:
- **company_name**: Nome da empresa (texto)
- **cnpj**: CNPJ da empresa (formato: XX.XXX.XXX/XXXX-XX)
- **full_name**: Nome completo do responsável
- **phone**: Telefone (formato brasileiro com DDD)
- **email**: Email válido (único no sistema)
- **password**: Senha (mínimo 6 caracteres)
- **role**: Papel no sistema (valores: "importer", "admin", "financeira", "super_admin")
- **status**: Status do usuário (valores: "active", "inactive")

### Campos Opcionais:
- **avatar**: URL ou base64 da foto de perfil

### Validações Importantes:
- CNPJ deve ser válido (verificação matemática dos dígitos)
- Email deve ser único
- CNPJ deve ser único
- Senha será criptografada automaticamente

---

## 2. Tabela de Análises de Crédito (credit_applications)

### Estrutura CSV/Excel:
```csv
user_id,legal_company_name,cnpj,address,city,state,zip_code,phone,email,business_sector,annual_revenue,requested_amount,status,pre_analysis_status,risk_level
20,"FioNobre Indústria e Comércio Têxtil LTDA","12.345.678/0001-90","Rua das Flores, 123","São Paulo","SP","01234-567","(11) 3456-7890","contato@fionobre.com","Têxtil","5000000-10000000","300000","pending","pending","medium"
```

### Campos Obrigatórios:
- **user_id**: ID do usuário (referência para tabela users)
- **legal_company_name**: Razão social da empresa
- **cnpj**: CNPJ da empresa
- **address**: Endereço completo
- **city**: Cidade
- **state**: Estado (sigla: SP, RJ, MG, etc.)
- **zip_code**: CEP
- **phone**: Telefone
- **email**: Email
- **business_sector**: Setor de negócio
- **annual_revenue**: Faturamento anual
- **requested_amount**: Valor solicitado em USD (número)

### Campos de Status:
- **status**: Status da aplicação (valores: "draft", "pending", "under_review", "approved", "rejected")
- **pre_analysis_status**: Status da pré-análise (valores: "pending", "under_review", "pre_approved", "needs_documents", "needs_clarification")
- **financial_status**: Status financeiro (valores: "pending_financial", "approved", "rejected", "needs_documents_financial")
- **admin_status**: Status admin (valores: "pending_admin", "admin_finalized")
- **risk_level**: Nível de risco (valores: "low", "medium", "high")

### Campos Opcionais (Informações Comerciais):
- **trading_name**: Nome fantasia
- **state_registration**: Inscrição estadual
- **municipal_registration**: Inscrição municipal
- **website**: Site da empresa
- **main_imported_products**: Principais produtos importados
- **main_origin_markets**: Principais mercados de origem
- **monthly_import_volume**: Volume mensal de importação
- **justification**: Justificativa para o crédito

### Campos de Análise Administrativa:
- **analysis_notes**: Notas da análise
- **requested_documents**: Documentos solicitados
- **admin_observations**: Observações para o importador
- **analyzed_by**: ID do analista (referência users)
- **analyzed_at**: Data da análise (formato: YYYY-MM-DD HH:MM:SS)

### Campos de Análise Financeira:
- **credit_limit**: Limite de crédito aprovado
- **approved_terms**: Prazos aprovados (JSON: ["30", "60", "90"])
- **financial_notes**: Observações da financeira
- **financial_analyzed_by**: ID do analista financeiro
- **financial_analyzed_at**: Data da análise financeira

### Campos de Finalização Admin:
- **final_credit_limit**: Limite final definido pelo admin
- **final_approved_terms**: Prazos finais (JSON: ["30", "60"])
- **final_down_payment**: Percentual de entrada (padrão: "30")
- **admin_fee**: Taxa administrativa em % (padrão: "10")
- **admin_final_notes**: Observações finais
- **admin_finalized_by**: ID do admin finalizador
- **admin_finalized_at**: Data da finalização

### Campos de Documentos:
- **required_documents**: Documentos obrigatórios (JSON)
- **optional_documents**: Documentos opcionais (JSON)
- **documents_status**: Status dos documentos ("pending", "partial", "complete")

### Campos Calculados:
- **used_credit**: Crédito utilizado (calculado automaticamente)
- **available_credit**: Crédito disponível (calculado)

---

## 3. Exemplo de Arquivo CSV Completo

### users.csv:
```csv
company_name,cnpj,full_name,phone,email,password,role,status
"Importadora ABC LTDA","11.222.333/0001-81","Maria Santos","(11) 98765-4321","maria@abc.com","senha123","importer","active"
"Comex Solutions LTDA","22.333.444/0001-92","Carlos Oliveira","(21) 97654-3210","carlos@comex.com","senha456","importer","active"
"Global Trade Corp","33.444.555/0001-03","Ana Paula","(31) 96543-2109","ana@global.com","senha789","importer","active"
```

### credit_applications.csv:
```csv
user_id,legal_company_name,cnpj,address,city,state,zip_code,phone,email,business_sector,annual_revenue,requested_amount,status,pre_analysis_status,risk_level,analysis_notes
1,"Importadora ABC LTDA","11.222.333/0001-81","Av. Paulista, 1000","São Paulo","SP","01310-100","(11) 3333-4444","contato@abc.com","Eletrônicos","1000000-5000000","150000","under_review","pre_approved","low","Empresa bem estruturada com histórico positivo"
2,"Comex Solutions LTDA","22.333.444/0001-92","Rua das Laranjeiras, 200","Rio de Janeiro","RJ","22240-000","(21) 2222-3333","financeiro@comex.com","Têxtil","500000-1000000","80000","pending","under_review","medium","Necessária verificação de documentos adicionais"
3,"Global Trade Corp","33.444.555/0001-03","Rua da Bahia, 300","Belo Horizonte","MG","30160-011","(31) 1111-2222","admin@global.com","Máquinas","5000000-10000000","500000","approved","pre_approved","low","Aprovado com limite de 400k"
```

---

## 4. Processo de Importação Recomendado

### Passo 1: Importar Usuários
1. Preparar arquivo users.csv com dados válidos
2. Validar CNPJs e emails únicos
3. Importar via endpoint POST /api/admin/bulk-import/users

### Passo 2: Importar Aplicações de Crédito
1. Usar os user_id gerados no passo anterior
2. Preparar arquivo credit_applications.csv
3. Importar via endpoint POST /api/admin/bulk-import/credit-applications

### Passo 3: Validação
1. Verificar dados importados via interface admin
2. Ajustar status e informações conforme necessário
3. Processar análises pendentes

---

## 5. Campos JSON Especiais

### shareholders (acionistas):
```json
[
  {"name": "João Silva", "cpf": "123.456.789-00", "percentage": "60"},
  {"name": "Maria Santos", "cpf": "987.654.321-00", "percentage": "40"}
]
```

### approved_terms (prazos aprovados):
```json
["30", "60", "90", "120"]
```

### required_documents (documentos obrigatórios):
```json
{
  "contrato_social": {"uploaded": true, "filename": "contrato.pdf"},
  "comprovante_endereco": {"uploaded": false, "filename": null}
}
```

---

## 6. Observações Importantes

- Todos os valores monetários são em string para preservar precisão
- Datas devem estar no formato ISO (YYYY-MM-DD HH:MM:SS)
- CNPJs devem passar pela validação matemática
- Emails devem ser únicos no sistema
- Status devem usar exatamente os valores especificados
- Campos JSON devem ter formato válido
- IDs de referência (user_id, analyzed_by, etc.) devem existir na tabela users