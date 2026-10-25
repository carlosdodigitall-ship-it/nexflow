# NexFlow — Motor de grafos (etapa 1)

Implementação independente do motor do n8n, usando seus conceitos públicos como referência e o REA como ferramenta opcional de análise local.

## Incluído
- Validação de DAG, IDs, tipos e portas condicionais.
- Ramificação `true`/`false`, fan-out para diversos nós, estado isolado por caminho.
- Execução assíncrona opcional, cancelamento cooperativo e limites de etapas/tempo.
- Histórico detalhado por nó e saídas múltiplas.
- Compatibilidade com a API de execução local existente.

## Limitações
- **Não suporta merge sincronizado**, loops, expressões, credenciais, IA nem integrações externas.
- Não é um motor de jobs persistente: um processo interrompido perde a execução.
- API Node local não está instalada como função de backend na Vercel.
- A execução de grafo é um MVP independente e ainda não foi conectada ao banco Supabase. O banco multi-tenant já foi preparado separadamente.
- REA não foi instalado no ambiente remoto e não houve acesso ao n8n Cloud privado.
- Executar nós HTTP de terceiros exigirá proteção SSRF e isolamento.

## Para usar
`npm test` e `npm start` com `NEXFLOW_API_TOKEN` definido. O API existente usa o motor síncrono, exceto onde adaptado para `runWorkflowAsync`.

Referência de pesquisa: `docs/REA_N8N_ARCHITECTURE.md`.
