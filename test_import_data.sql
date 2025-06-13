-- Inserir dados de teste para demonstrar o sistema de importações
INSERT INTO imports (
  user_id, 
  supplier_name, 
  supplier_location, 
  product_description, 
  total_value, 
  currency, 
  status, 
  notes,
  created_at
) VALUES 
(1, 'Shenzhen Electronics Co.', 'Shenzhen, China', 'Smartphones Samsung Galaxy A54', '45000', 'USD', 'planning', 'Primeira importação de smartphones', NOW()),
(1, 'Beijing Tech Ltd.', 'Beijing, China', 'Componentes Eletrônicos', '28000', 'USD', 'ordered', 'Componentes para montagem', NOW() - INTERVAL '3 days'),
(1, 'Guangzhou Hardware Inc.', 'Guangzhou, China', 'Equipamentos de Informática', '65000', 'USD', 'shipped', 'Computadores e periféricos', NOW() - INTERVAL '1 week'),
(1, 'Dongguan Manufacturing', 'Dongguan, China', 'Acessórios Mobile', '15000', 'USD', 'delivered', 'Capas e carregadores', NOW() - INTERVAL '2 weeks');