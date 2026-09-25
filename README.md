# Jeiel IT Advisory

Página pessoal estática para apresentar Jeiel Borner como Head de TI ou consultor executivo para operações críticas. Inclui cinco abas: Executivo, Operação, Carreira, Diagnóstico Executivo de TI e Desenvolvimento.

## Ver localmente

```bash
python3 -m http.server 8080
```

Depois abra `http://localhost:8080`.

## Antes de publicar

Substitua os campos de contato, complete cronologia/formação/certificações e revise todas as evidências profissionais. A página evita inventar dados que não estavam disponíveis no histórico recuperado.

## Formulário de contato (Brevo)

O formulário do modal "Iniciar uma conversa executiva" envia os dados por e-mail via [api/contact.js](api/contact.js), uma Vercel Serverless Function que chama a API transacional do Brevo. A chave de API fica só no servidor (variável de ambiente), nunca no navegador.

1. Copie `.env.example` para `.env` e preencha com os dados da sua conta Brevo:
   - `BREVO_API_KEY` — em Brevo: Transactional > API keys.
   - `BREVO_SENDER_EMAIL` — um remetente verificado (Senders & IP > Senders).
   - `CONTACT_TO_EMAIL` — caixa que recebe as solicitações (padrão: `jeiel.borner+advisory@gmail.com`).
2. Configure as mesmas variáveis no projeto na Vercel (Settings > Environment Variables).
3. Para testar localmente com a função serverless, use `vercel dev` (requer `npm i -g vercel` e `vercel link`) em vez do `python3 -m http.server`.
