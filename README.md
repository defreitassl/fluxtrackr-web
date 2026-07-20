# FluxTrackr Web

Frontend desktop do FluxTrackr. Inclui autenticação via BFF, App Shell,
Dashboard e Timeline somente de leitura, consolidados pela API.

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

## Timeline

`/timeline` usa somente `GET /financial-timeline`, pelo adapter em
`src/features/timeline/api/`. A query principal inclui todos os filtros na
chave:

```ts
["financial-timeline", { startDate, endDate, type, sourceType, includeCanceled }]
```

A tela abre no mês UTC atual, envia `startDate` e `endDate` UTC para a API e
permite navegar mensalmente, atualizar manualmente e filtrar por tipo, origem
e itens cancelados. O resumo e a ordem dos itens vêm diretamente da resposta;
o frontend apenas agrupa visualmente por dia UTC e traduz enums.

Os horários da Timeline são formatados em UTC e exibem o sufixo `UTC`, para
deixar explícita a mesma regra usada nas fronteiras e no agrupamento financeiro.

## Carteira

`/wallet` reutiliza o panorama de `GET /dashboard-overview` pela mesma query
key `['dashboard-overview']` e compõe a consulta própria:

```ts
["wallet-overview", { year, month }]
```

`year` e `month` são obtidos em UTC por `useCurrentWalletPeriod`, que recalcula
o período no mount, ao recuperar o foco da janela, no `visibilitychange` visível
e antes de uma atualização manual — sem polling nem timers. A leitura usa
`GET /accounts`, `GET /accounts/:id/balance` em paralelo por conta,
`GET /credit-cards?isActive=true` e `GET /credit-card-invoices?year=&month=`. A
API continua sendo a fonte de todos os saldos, disponível para gastar, limite e
valores de fatura: o frontend não soma nem recalcula.

O panorama distingue três estados do Dashboard — carregando, disponível e
indisponível — sem confundir carregamento com ausência de próxima fatura. A
atualização é coordenada entre Carteira e Dashboard; falhas parciais mostram um
único alerta e mantêm os dados anteriores visíveis. A seleção separa
`selectedCardId` de `selectedInvoiceId`: todo cartão ativo é selecionável (mesmo
sem fatura) e faturas cujo cartão não está na lista ativa continuam acessíveis,
somente leitura, em “Outras faturas do mês”.

### Gestão de contas

A Carteira permite **criar** e **editar metadados** de contas:

- `POST /accounts` cria a conta; `PATCH /accounts/{id}` edita metadados.
- O **saldo inicial** (`initialBalance`) é obrigatório e definido **somente na
  criação**; a tela de edição não o expõe. Correções de saldo terão um fluxo
  próprio de ajuste (ainda fora deste recorte).
- Campos: nome, banco (opcional), tipo, cor (opcional) e ícone (opcional); na
  criação também o saldo inicial. Na criação, campos opcionais vazios são
  omitidos; na edição, um valor apagado é enviado como `null`.
- Formulários com React Hook Form + Zod + `zodResolver`; diálogo acessível
  reutilizável em `src/components/ui/dialog.tsx` (foco controlado, retorno de
  foco ao acionador, `aria-modal`, fechamento por Escape, bloqueio durante
  envio), sem biblioteca externa de overlays nem de toast.
- Após criar ou editar, as mutations invalidam `['wallet-overview']` e
  `['dashboard-overview']`; não há atualização otimista de valores financeiros.
  A conta criada/editada permanece selecionada após o refetch e o sucesso é
  comunicado por feedback inline com `role="status"`.
- **Arquivamento fora do escopo:** a API atual apenas define `isActive=false` e
  ainda não possui política consolidada para dependências ativas, então nenhuma
  ação de arquivar/excluir/transferir é exposta.

## Validação local integrada

Com a API e as fixtures locais configuradas com credenciais não versionadas:

```bash
# API
cd ../fluxtrackr-api
npm run prisma:seed
npm run prisma:seed:dashboard-dev
PORT=3001 npm run start:dev

# Web
cd ../fluxtrackr-web
npm run dev
```

## Testes

`npm test` executa Vitest com Testing Library. Cobertura inicial prioriza
redirecionamento seguro, adapter do Dashboard e estados críticos da interface.
