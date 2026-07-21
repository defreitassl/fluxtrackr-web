# FluxTrackr Web

Frontend desktop do FluxTrackr. Inclui autenticação via BFF, App Shell e seis
telas principais: Dashboard, Timeline, Planejamento, Carteira, Transações e
Categorias. Os valores financeiros exibidos são consolidados pela API.

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

## Categorias

`/categories` usa exclusivamente o cliente Orval para listar, criar, editar e
arquivar categorias. A consulta aceita status (ativas, arquivadas ou todas) e
tipo; `includeArchived=true` preserva o padrão histórico de listar somente
ativas quando nenhum filtro é informado. Arquivar por `DELETE /categories/:id`
preserva o histórico e arquiva os orçamentos ativos vinculados no backend.

Não há atualização otimista. Após escrita, a tela invalida `['categories']`,
atualizando os seletores de Transações sem recalcular dados financeiros.

Ícone e cor são uma apresentação estável derivada de `id`, nome e tipo da
categoria. Não são campos persistidos, não fazem parte do payload e não alteram
a semântica financeira da categoria.

## Planejamento

`/planning` consulta `GET /category-budgets/overview` por mês e ano UTC e
`GET /categories?isActive=true` para identificar categorias elegíveis sem
orçamento. Limite, gasto, restante, percentual e status chegam consolidados da
API; a tela não calcula valores nem redefine os status
`within_budget`, `near_limit` ou `exceeded`.

A troca de período, o filtro de status e a ordenação existem somente para
apresentação. O filtro seleciona itens pelo status retornado e a ordenação não
altera o array nem a ordem de desempate fornecida pela API. Criar, editar ou
arquivar um orçamento invalida `['category-budget-overview']`,
`['category-budgets']`, `['financial-timeline']` e `['dashboard-overview']`,
sem atualização otimista.

## Transações

`/transactions` lista a resposta completa de `GET /transactions`, sem paginação
ou infinite scroll artificiais. Os filtros disponíveis são tipo, período UTC,
categoria, conta e método de pagamento. As datas de filtro são limites de dias
UTC; no formulário, `datetime-local` representa o horário local informado pelo
usuário e é convertido para ISO antes da API. A listagem explicita o horário em
UTC, evitando uma mudança implícita de dia na apresentação.

Criação usa `source: 'app'`; edição nunca altera a origem. Categorias e contas
arquivadas não aparecem em novos seletores, mas uma categoria histórica é
mantida ao editar outros campos. A API bloqueia categorias arquivadas ou
incompatíveis com o tipo da transação em novas classificações. O diálogo de
detalhe mostra os campos retornados pela transação, inclusive conta, categoria,
método, origem e datas em UTC.

O resumo mensal usa `GET /monthly-summary` para o mês UTC selecionado (ou o mês
UTC atual sem filtro de data) e exibe receitas lançadas, despesas lançadas e
saldo disponível exatamente como retornados. Quando as datas de início e fim
abrangem mais de um mês UTC, o Web não consulta nem exibe o resumo e informa
que ele está disponível apenas para períodos dentro do mesmo mês. A lista nunca
é somada no cliente para produzir esse resumo.

**Nova movimentação** é somente um seletor de fluxo: encaminha para o
formulário de receita/despesa, transferência entre contas ou compra no cartão.
Ele não cria registro nem calcula valor por conta própria; transferência exige
duas contas ativas e a compra deixa parcelas e fatura sob responsabilidade da
API.

As mutations de transação não são otimistas e invalidam `['transactions']`,
`['monthly-summary']`, `['wallet-overview']`, `['dashboard-overview']` e
`['financial-timeline']`. Exclusão é física, requer confirmação explícita e
deixa os cálculos financeiros para a API.

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

### Cartões, compras e faturas

A Carteira permite criar, editar e arquivar cartões, consultar faturas e
parcelas do período UTC atual e registrar uma compra pelo fluxo
`POST /credit-card-purchases`. A compra não gera parcelas, fatura ou totais no
cliente: esses resultados vêm da API. Depois dela, o Web invalida
`['wallet-overview']`, `['dashboard-overview']`, `['financial-timeline']`,
`['credit-card-purchases']`, `['credit-card-invoices']` e
`['category-budget-overview']`.

Uma fatura aberta, fechada ou vencida pode ser paga integralmente em uma conta
selecionada por `POST /credit-card-invoices/{id}/pay`. O pagamento invalida
`['wallet-overview']`, `['dashboard-overview']`, `['financial-timeline']`,
`['credit-card-invoices']`, `['credit-card-purchases']`, `['transactions']` e
`['monthly-summary']`; não atualiza saldo, status ou valor de fatura de forma
otimista.

### Gestão de contas

A Carteira permite **criar** e **editar metadados** de contas:

- `POST /accounts` cria a conta; `PATCH /accounts/{id}` edita metadados.
- O **saldo inicial** (`initialBalance`) é obrigatório e definido **somente na
  criação**; a tela de edição não o expõe. Correções usam o fluxo próprio de
  ajuste de saldo, sem alterar retrospectivamente a composição financeira.
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
  ação de arquivar ou excluir é exposta.

### Ajuste de saldo e histórico

No detalhe da conta selecionada, **Ajustar saldo** usa `POST
/accounts/{accountId}/balance-adjustments` e envia somente `newBalance` como
string decimal canônica e `reason` opcional. A API calcula e persiste o saldo
anterior e a diferença; o Web não calcula diferença, não cria transação e não
faz atualização otimista. O formulário aceita saldo negativo, zero e o mesmo
saldo atual.

O histórico usa `GET /accounts/{accountId}/balance-adjustments`, preserva a
ordem da API e exibe inicialmente até cinco itens. Depois de um ajuste, a
mutation invalida `['account-balance-adjustments', accountId]`,
`['wallet-overview']`, `['dashboard-overview']` e `['financial-timeline']`.

Em erro de atualização, o histórico preserva a lista, exibe um alerta local e
permite tentar novamente; carregamentos de atualização também são discretos e
não substituem os dados. O estado de “Mostrar todos” é isolado por conta.

### Transferências entre contas

O detalhe da conta oferece **Transferir** quando há duas ou mais contas ativas.
O diálogo envia somente `sourceAccountId`, `destinationAccountId`, `amount`
decimal canônico positivo e `description` opcional a `POST /account-transfers`;
não envia `occurredAt`, não compara saldo disponível e não calcula saldos.
Transferência não é receita nem despesa e não cria `Transaction`.

`GET /account-transfers?accountId=` alimenta o histórico da conta selecionada
pela chave `['account-transfers', { accountId }]`. Ele preserva a ordem da API,
mostra até cinco itens inicialmente e identifica cada item como enviada ou
recebida, com a conta oposta ou o fallback para conta indisponível. Após sucesso
a mutation invalida `['account-transfers']`, `['wallet-overview']`,
`['dashboard-overview']` e `['financial-timeline']`; não há update otimista.

Entradas monetárias da criação de conta, ajuste e transferência aceitam vírgula
ou ponto, mas normalizam para `Decimal(12,2)` (`-9.999.999.999,99` a
`9.999.999.999,99`) antes de enviar. O Web continua somente apresentando os
saldos retornados pela API.

## Prontidão para deploy

O recorte desktop considerado para fechamento reúne as seis telas principais:
Dashboard, Timeline, Planejamento, Carteira, Transações e Categorias. O deploy
não é consequência automática de concluir uma tela; ele só é iniciado após a
revisão integrada desse conjunto e de suas validações.

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
