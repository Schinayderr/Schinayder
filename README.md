# Schinayder — Commerce OS

Plataforma em desenvolvimento para combinar loja pública e painel administrativo de uma operação de e-commerce integrada ao Mercado Livre.

## Stack
- React + TypeScript + Vite
- Tailwind CSS será introduzido na etapa de refinamento de componentes
- Recharts para visualização de indicadores
- Framer Motion para microinterações
- Supabase planejado para autenticação e persistência

## Executar localmente
```bash
npm install
npm run dev
```

## Estado atual
A interface inicial usa dados demonstrativos. Nenhuma venda, pedido, produto ou sincronização exibida representa dados reais. A conexão com o Mercado Livre ainda não está ativa.

## Integração Mercado Livre
A integração deverá usar OAuth 2.0 e endpoints oficiais. `ML_CLIENT_SECRET`, tokens e operações de troca/renovação devem permanecer exclusivamente no servidor (Edge Functions ou backend). Nunca inserir segredos em variáveis `VITE_*` ou no código do navegador.

## Próximas etapas
1. Refinar navegação, responsividade e componentes.
2. Provisionar Supabase e implementar autenticação real.
3. Criar fluxo OAuth com validação de `state`, armazenamento seguro e renovação de tokens.
4. Implementar sincronização de anúncios, pedidos, pagamentos, envios e estoque.
5. Validar permissões e publicar em hospedagem.

## Dados de demonstração
Os números e registros da primeira tela são fictícios e servem somente para validar a experiência visual.
