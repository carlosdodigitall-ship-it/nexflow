# NexFlow — IA no preview

O endpoint `POST /api/assistant` está preparado e exige sessão autenticada do Supabase. O frontend salva a mensagem do usuário no histórico e solicita a resposta à API de IA no servidor.

## Variáveis para configurar na Vercel (Preview)

- `OPENAI_API_KEY`: chave secreta do provedor. Defina diretamente no painel da Vercel, nunca no chat ou GitHub.
- `SUPABASE_PUBLISHABLE_KEY`: chave publicável do projeto Supabase NexFlow, no painel Supabase > Settings > API Keys.
- `OPENAI_MODEL` (opcional): modelo autorizado pela conta. O exemplo utiliza `gpt-4.1-mini`; valide sua disponibilidade.

## Limitações atuais

- Ainda não há streaming SSE; a resposta é exibida quando completa.
- A resposta da IA é exibida apenas na sessão atual; o banco mantém a mensagem do usuário, mas salvar a resposta do assistente requer API server-side com permissões limitadas.
- Ainda não há geração estruturada validada de workflows nem conexão automática ao editor.
- Falta renovação segura da sessão, limites de uso por usuário, controle de custos e testes e2e autenticados.
- O REA não está conectado ativamente ao ambiente de desenvolvimento.

Não habilitar cobrança nem anunciar a IA como disponível antes de configurar as chaves e concluir testes funcionais e de segurança.
