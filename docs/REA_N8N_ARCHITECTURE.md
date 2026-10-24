# REA + n8n — investigação técnica para o NexFlow

## Escopo e limites

O [REA](https://github.com/morluto/rea) é uma ferramenta de engenharia reversa que funciona como MCP/CLI no computador do desenvolvedor. **Não é um conector de produção do NexFlow e não acessa uma sessão privada do n8n Cloud sem autenticação autorizada.** Não copiar código, tokens, cookies ou ativos proprietários do n8n. Usar documentação pública e exportações JSON dos próprios workflows.

## Configuração local opcional do REA

1. Instale Node.js em versão suportada pela documentação atual e npm.
2. Revise a origem oficial `morluto/rea` e execute `npx rea-agents setup` em máquina de desenvolvimento confiável.
3. Selecione o agente de programação suportado, confira as alterações no arquivo MCP e reinicie o agente.
4. Execute `rea doctor` para conferir a instalação. Nunca publique tokens/cookies capturados pelo navegador em commits.
5. Investigue exclusivamente aplicativos e fluxos para os quais exista autorização.

A conexão MCP precisa acontecer no **ambiente do agente local**, não em `public/` ou em uma função serverless de produção. Nenhum MCP do REA está registrado automaticamente no ambiente do ChatGPT por este arquivo.

## Estudo de arquitetura do n8n: pontos prioritários

- **Representação:** workflow como grafo dirigido de nós (tipo, versão, parâmetros, identidade e credenciais referenciadas) e conexões nomeadas por portas.
- **Dados:** cada etapa pode produzir vários itens; item linking preserva a correspondência entrada/saída (`pairedItem` no n8n). NexFlow deve definir o contrato de dados antes de implementar Merge e Loop.
- **Editor:** canvas com múltiplas entradas/saídas, posicionamento livre, zoom, seleção e propriedades dos nós, validação de tipos e condições.
- **Execução:** executor assíncrono com checkpoints de etapa, estados queued/running/success/error/cancelled, cancelamento, retentativa, tratamento de erros e limites de concorrência.
- **Gatilhos:** manual, webhook assinado e scheduler; separar registro do gatilho de execução do workflow.
- **Credenciais:** referências a segredos, armazenamento criptografado fora do cliente, permissões por workspace, nunca incluir valores em exportações ou logs.
- **Histórico:** salvar metadados, duração, outputs sanitizados e correlação por etapa; permitir inspeção e replay controlado, sem duplicar efeitos colaterais acidentalmente.
- **Isolamento SaaS:** Supabase Auth, workspaces, membership e RLS; operações de worker devem aplicar checagem de escopo e auditoria, sem confiar em IDs fornecidos pelo cliente.

## Gap atual NexFlow

O `src/engine.js` existente suporta apenas trigger, set, condition e output; executa sequencialmente em memória. O editor atual também é sequencial e o deploy da Vercel serve apenas os arquivos estáticos. Esses recursos **não são equivalentes ao motor do n8n**.

### Ordem de implementação

1. Definir modelo versionado de nós e portas com validação de conexões.
2. Construir executor DAG com ramificações condicionais, fan-out/fan-in e contrato por item.
3. Criar API de execução autenticada vinculada a workspace, com worker e fila.
4. Integrar Supabase com RLS e histórico de execução.
5. Adicionar nós HTTP Request e Webhook com proteção SSRF, timeouts e controle de retries.
6. Construir editor visual com XYFlow; executar testes unitários, de integração e de isolamento entre tenants.
7. Depois integrar assistente de IA para sugerir e ajustar fluxos mediante revisão humana.

## Fontes oficiais estudadas

- REA: https://github.com/morluto/rea
- Instalação: https://github.com/morluto/rea/blob/main/docs/installation.md
- n8n — Itens vinculados: https://docs.n8n.io/data/data-mapping/data-item-linking/item-linking-node-building/
- n8n — Expressões e mapeamento: https://docs.n8n.io/data/data-mapping/data-mapping-ui/
- n8n — Execuções: https://docs.n8n.io/workflows/executions/all-executions/
- n8n — Visão geral: https://docs.n8n.io/

Data: 2026-10-24. Documento de investigação e arquitetura, não uma implementação do motor nem conexão REA ativa.
