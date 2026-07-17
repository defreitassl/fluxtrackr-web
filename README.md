# FluxTrackr Web

Frontend desktop do FluxTrackr. Inclui autenticação via BFF, App Shell e
Dashboard somente de leitura, consolidado pela API.

## Stack

- Next.js 16, React 19 e TypeScript estrito
- Tailwind CSS 4 para base de estilos e tokens CSS do produto
- TanStack Query, React Hook Form, Zod, Lucide e clsx
- Orval gerando cliente Fetch a partir do contrato OpenAPI

## Configuração

```bash
cp .env.example .env.local
npm install
```

Defina `FLUXTRACKR_API_URL` com origem da API, por exemplo
`http://localhost:3001`. A variável é apenas server-side: não use
`NEXT_PUBLIC_` e nunca adicione token ao arquivo de ambiente.

## Comandos

```bash
npm run api:generate # gera src/api/generated/client.ts
npm run api:check    # regenera e acusa cliente versionado desatualizado
npm run dev
npm test
npm run lint
npm run build
```

## Estrutura

```text
src/
├── api/generated/   # saída do Orval; não editar manualmente
├── app/             # App Router e Route Handlers BFF
├── components/      # shell e estados reutilizáveis
├── features/        # auth, Dashboard e placeholders iniciais
├── lib/             # HTTP, sessão, formatação e ambiente
├── providers/       # Query, sessão e tema
└── styles/          # Tailwind + tokens CSS FluxTrackr
```

## Autenticação

`/login` envia credenciais para `POST /api/auth/login`. Esse Route Handler
chama `POST /auth/login` da API e guarda somente o JWT em cookie `httpOnly`,
`Secure` em produção e `SameSite=Lax`. O navegador não lê nem envia Bearer
token diretamente: chamadas geradas pelo Orval passam por
`/api/fluxtrackr/*`, que adiciona `Authorization` no servidor. `401` remove a
sessão e leva o usuário ao login. Não há refresh token, por limitação atual da
API.

## Dashboard

`/dashboard` usa somente `GET /dashboard-overview`. Adapter em
`src/features/dashboard/api/` desempacota resposta do cliente gerado pelo
Orval; TanStack Query usa chave `['dashboard-overview']`, sem polling.
Valores financeiros vêm diretamente da API; frontend não recalcula saldo,
orçamento, meta diária, previsão ou faturas.

## Testes

`npm test` executa Vitest com Testing Library. Cobertura inicial prioriza
redirecionamento seguro, adapter do Dashboard e estados críticos da interface.
