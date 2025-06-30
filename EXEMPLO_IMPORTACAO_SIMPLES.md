# Importação CSV - Guia Prático Simples

## Como Importar Seu CSV de Clientes (Sem Modificar Nada)

### Passo 1: Preparar o Arquivo CSV
Seu arquivo CSV deve ter exatamente estes campos no cabeçalho:

```csv
company_name,cnpj,full_name,phone,email,password,role,status
```

### Passo 2: Exemplo de Dados
```csv
company_name,cnpj,full_name,phone,email,password,role,status
"Importadora ABC LTDA","11.222.333/0001-81","João Silva","(11) 99999-9999","joao@abc.com","senha123","importer","active"
"Comex Solutions LTDA","22.333.444/0001-92","Maria Santos","(21) 98765-4321","maria@comex.com","senha456","importer","active"
"Global Trade Corp","33.444.555/0001-03","Carlos Oliveira","(31) 97654-3210","carlos@global.com","senha789","importer","active"
```

### Passo 3: Acessar a Página de Importação
1. Entre como usuário admin no sistema
2. No menu lateral, clique em "Importar CSV" 
3. A página será aberta em: `/admin/csv-import`

### Passo 4: Fazer o Upload
1. Selecione "Importadores" como tipo de importação
2. Clique em "Escolher arquivo" e selecione seu CSV
3. Clique em "Iniciar Importação"

### Passo 5: Verificar Resultados
- O sistema mostrará quantos registros foram criados
- Qualquer erro será listado com detalhes
- Usuários criados aparecerão na lista de usuários

## Endpoints Diretos (Para Integração)

Se preferir fazer via API diretamente:

### Importar Usuários:
```bash
curl -X POST http://localhost:5000/api/admin/bulk-import/users \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=SEU_SESSION_ID" \
  -d '{
    "users": [
      {
        "companyName": "Importadora ABC LTDA",
        "cnpj": "11.222.333/0001-81",
        "fullName": "João Silva",
        "phone": "(11) 99999-9999",
        "email": "joao@abc.com",
        "password": "senha123",
        "role": "importer",
        "status": "active"
      }
    ]
  }'
```

### Resposta Exemplo:
```json
{
  "message": "Importação concluída: 3 usuários criados, 0 erros",
  "results": {
    "success": 3,
    "errors": [],
    "created": [
      {"id": 1, "email": "joao@abc.com", "companyName": "Importadora ABC LTDA"}
    ]
  }
}
```

## Campos Obrigatórios

- **company_name**: Nome da empresa
- **cnpj**: CNPJ válido (com ou sem formatação)
- **full_name**: Nome completo do responsável
- **phone**: Telefone (qualquer formato)
- **email**: Email válido e único
- **password**: Senha (será criptografada automaticamente)

## Campos Opcionais

- **role**: Papel (valores: "importer", "admin", "financeira", "super_admin") - padrão: "importer"
- **status**: Status (valores: "active", "inactive") - padrão: "active"

## Validações Automáticas

- CNPJ é validado matematicamente
- Email deve ser único no sistema
- Senhas são criptografadas com bcrypt
- Campos obrigatórios são verificados

## Tratamento de Erros

- Emails duplicados: Usuário não é criado, erro é reportado
- CNPJ inválido: Erro é reportado com linha específica
- Campos faltando: Erro detalhado por linha

O sistema NÃO é modificado durante a importação - apenas são inseridos novos dados via endpoints específicos.