# 🚀 PROMPT PARA REPLIT AGENT - INTEGRAÇÃO SPARK COMEX x PAY COMEX

## OBJETIVO:
Criar endpoints específicos na Pay Comex para receber dados de usuários do Spark Comex e processar autenticação + cadastro automático.

## ENDPOINTS NECESSÁRIOS PARA INTEGRAÇÃO:

### 1. AUTENTICAÇÃO COM TOKEN POR EMAIL
```
POST /api/v1/public/auth/spark-comex-login
```

**Request Body:**
```json
{
  "email": "user@empresa.com",
  "password": "senha_paycomex",
  "integration_source": "spark_comex"
}
```

**Response Success:**
```json
{
  "success": true,
  "token_sent": true,
  "verification_token_id": "vtk_123456789",
  "message": "Token de verificação enviado para o email",
  "expires_in": 300
}
```

### 2. CONFIRMAÇÃO DO TOKEN
```
POST /api/v1/public/auth/verify-token
```

**Request Body:**
```json
{
  "verification_token_id": "vtk_123456789",
  "token_code": "123456",
  "integration_source": "spark_comex"
}
```

**Response Success:**
```json
{
  "success": true,
  "authenticated": true,
  "session_token": "st_paycomex_abcdef123456",
  "user_profile": {
    "id": "usr_123",
    "email": "user@empresa.com",
    "profile_complete": false
  }
}
```

### 3. RECEBIMENTO DE DADOS DO SPARK COMEX
```
POST /api/v1/public/integration/spark-comex-profile
```

**Headers:**
```
Authorization: Bearer st_paycomex_abcdef123456
Content-Type: application/json
```

**Request Body (dados extraídos do Spark Comex):**
```json
{
  "company_data": {
    "legal_name": "EMPRESA IMPORTADORA LTDA",
    "trade_name": "Importadora 123",
    "cnpj": "12.345.678/0001-90",
    "address": {
      "street": "Rua das Flores, 123",
      "city": "São Paulo",
      "state": "SP",
      "zip_code": "01234-567",
      "country": "BR"
    },
    "phone": "+55 11 99999-9999",
    "email": "contato@empresa.com",
    "website": "www.empresa.com"
  },
  "legal_representative": {
    "name": "João Silva Santos",
    "cpf": "123.456.789-10",
    "email": "joao@empresa.com",
    "phone": "+55 11 88888-8888",
    "position": "CEO"
  },
  "financial_info": {
    "approved_credit": 500000,
    "currency": "USD",
    "annual_revenue": "1M-5M",
    "business_sector": "importacao",
    "bank_references": ["Banco do Brasil", "Itaú"]
  },
  "documents": {
    "business_license": "base64_encoded_file",
    "financial_statements": "base64_encoded_file",
    "tax_clearance": "base64_encoded_file"
  },
  "integration_metadata": {
    "spark_comex_user_id": 38,
    "credit_application_id": 68,
    "integration_date": "2025-07-04T22:45:00Z"
  }
}
```

**Response Success:**
```json
{
  "success": true,
  "profile_created": true,
  "paycomex_user_id": "usr_sparkcomex_12345",
  "profile_status": "active",
  "available_payment_methods": ["pix", "credit_card", "bank_transfer"],
  "verification_status": {
    "company_verified": true,
    "documents_verified": true,
    "ready_for_payments": true
  }
}
```

### 4. CHECKOUT ESPECÍFICO PARA SPARK COMEX
```
POST /api/v1/public/checkout/spark-comex-create
```

**Headers:**
```
Authorization: Bearer st_paycomex_abcdef123456
```

**Request Body:**
```json
{
  "payment_data": {
    "amount": 11550.00,
    "currency": "USD",
    "payment_type": "import_installment",
    "installment_number": 1,
    "total_installments": 4,
    "due_date": "2025-08-15",
    "description": "Pagamento Importação #13 - Parcela 1/4"
  },
  "supplier_data": {
    "name": "Shanghai Industrial Co Ltd",
    "country": "CN",
    "account_details": {
      "bank_name": "Bank of China",
      "account_number": "1234567890",
      "swift_code": "BKCHCNBJ"
    }
  },
  "import_reference": {
    "spark_comex_import_id": 13,
    "payment_schedule_id": 23,
    "import_description": "Pasta de Tomate - Container FCL"
  },
  "return_urls": {
    "success_url": "https://sparkcomex.replit.app/payments/23/success",
    "cancel_url": "https://sparkcomex.replit.app/payments/23/cancel",
    "webhook_url": "https://sparkcomex.replit.app/api/webhooks/paycomex"
  }
}
```

**Response Success:**
```json
{
  "success": true,
  "checkout_id": "chk_sparkcomex_67890",
  "payment_url": "https://paycomex.replit.app/checkout/chk_sparkcomex_67890",
  "qr_code_pix": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "pix_code": "00020126330014BR.GOV.BCB.PIX...",
  "payment_methods": {
    "pix": {
      "fee_percentage": 1.5,
      "estimated_total_brl": 58000.50
    },
    "credit_card": {
      "fee_percentage": 2.5,
      "estimated_total_brl": 58579.00
    }
  },
  "expires_at": "2025-07-04T23:45:00Z"
}
```

### 5. WEBHOOK PARA SPARK COMEX
```
POST https://sparkcomex.replit.app/api/webhooks/paycomex
```

**Payload que a Pay Comex deve enviar:**
```json
{
  "event": "payment.completed",
  "checkout_id": "chk_sparkcomex_67890",
  "spark_comex_payment_id": 23,
  "spark_comex_import_id": 13,
  "payment_status": "paid",
  "payment_data": {
    "amount_paid": 11550.00,
    "currency": "USD",
    "amount_brl": 58000.50,
    "fee_brl": 870.00,
    "payment_method": "pix",
    "transaction_id": "txn_paycomex_98765",
    "paid_at": "2025-07-04T22:50:00Z"
  },
  "signature": "sha256_hash_for_verification"
}
```

## IMPLEMENTAÇÃO ESPECÍFICA NECESSÁRIA:

### 1. Sistema de Autenticação por Token
- Gerar códigos de 6 dígitos
- Envio por email com validade de 5 minutos
- Session tokens com duração de 30 minutos

### 2. Mapeamento de Dados Brasileiros
- Validação de CNPJ
- Formatação de telefones brasileiros (+55)
- Suporte a documentos brasileiros (RG, CPF, IE)

### 3. Conversão de Moedas
- USD → BRL para exibição de valores
- Taxas em tempo real
- Cálculo de taxas (PIX 1.5%, Cartão 2.5%)

### 4. Segurança
- Verificação de origem (Spark Comex)
- Assinatura de webhooks com HMAC-SHA256
- Rate limiting para tentativas de login

## RESULTADO ESPERADO:
- Usuário faz login na Pay Comex pelo Spark Comex
- Dados são transferidos automaticamente
- Perfil fica completo e verificado
- Checkout funciona imediatamente
- Webhooks confirmam pagamentos no Spark Comex

Esta integração permitirá que usuários do Spark Comex usem a Pay Comex sem re-digitação de dados, mantendo a experiência fluida entre as duas plataformas.