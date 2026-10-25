# NexFlow — Plano técnico do Assistente (fase 1)

## Objetivo
Dashboard própria inspirada na ergonomia de assistentes de automação, com barra lateral estreita, topo, composer central, sugestões, histórico e autenticação Supabase.

## Rotas
- `/assistant`: assistente com Auth + histórico de conversas.
- `/app`: editor de workflows existente, preservado.
- `/`: landing do NexFlow.

## Componentes
AssistantRail, AssistantTopbar, AuthCard, HistoryDrawer, AssistantComposer, SuggestionChips, MessageTimeline. A primeira versão usa HTML/CSS/JavaScript independentes, sem instalar React ou mudar o motor.

## Persistência
- `assistant_threads`: uma conversa por `user_id`, RLS CRUD proprietário.
- `assistant_messages`: mensagem de usuário, RLS impede inserção como assistente. Respostas por IA exigem futura função de backend autenticada.
- `workspaces`, `workflows`, `workflow_runs`: banco inicial já criado; **ainda não integrado a esta UI**.

## Segurança
- Chave publishable pública (permitida em frontend), nunca service_role.
- Sessão mantida apenas na aba em sessionStorage; renovação automática de token ainda pendente.
- Supabase Auth e RLS por `auth.uid()` para isolar usuários.
- Sem endpoint de IA: as mensagens são salvas e não fingimos respostas.

## Não implementado
- Streaming IA e geração de workflow, cobrança e medidor de execução, anexos e microfone.
- Backend Vercel para execução persistente e sincronização de workflows.
- REA MCP local não conectado: somente estudo de conceitos e referência visual autorizada.

## Teste manual
1. Abrir `/assistant` no preview e criar usuário.
2. Confirmar e-mail (caso Auth exija).
3. Entrar, criar conversa, escolher sugestão e salvar mensagem.
4. Recarregar página: o histórico permanece na mesma aba.
5. Verificar com segundo usuário que o histórico do primeiro não aparece.
