# Finora — frontend financeiro

Frontend em Next.js (App Router) e TypeScript para a API NestJS financeira. A interface está em português do Brasil, é responsiva e usa uma camada BFF para que o navegador nunca acesse o backend nem receba os tokens diretamente.

## Requisitos

- Node.js 20.9 ou superior
- npm
- Backend NestJS em execução (por padrão em `http://localhost:3000`)

## Instalação

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra `http://localhost:3001`. Como o backend usa a porta 3000, o Next.js normalmente selecionará a 3001 automaticamente. Também é possível definir explicitamente:

```bash
npm run dev -- -p 3001
```

O arquivo `.env.local` deve conter apenas a URL server-side do backend:

```env
API_BASE_URL=http://localhost:3000
```

Não prefixe essa variável com `NEXT_PUBLIC_`: ela é usada exclusivamente pelos Route Handlers.

## Backend

Na raiz do projeto do backend, instale suas dependências e inicie-o conforme a documentação própria. O frontend espera os contratos descritos para `/users`, `/auth/*`, `/users/me` e `/financial-entries`. O Swagger deve ficar disponível em `http://localhost:3000/docs`.

O backend não estava presente no workspace disponibilizado durante a implementação, então os contratos foram implementados estritamente conforme o briefing fornecido.

## Segurança e autenticação

- O navegador chama somente rotas locais em `/api`.
- `accessToken` e `refreshToken` são cookies `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
- Uma resposta 401 protegida dispara uma única tentativa de renovação em `/auth/refresh`.
- Os dois cookies são substituídos após a rotação do refresh token.
- Se a renovação falhar, os cookies são apagados e o usuário volta ao login.
- O middleware verifica a presença da sessão e o layout privado valida o usuário em `/users/me`.
- O logout chama o backend antes de remover os cookies locais.

## Rotas da interface

- `/login` e `/cadastro`
- `/dashboard`
- `/contas`
- `/contas/nova`
- `/contas/importar`
- `/perfil`

O dashboard consome `GET /financial-entries`, percorre a paginação e usa `GET /financial-entries/summary` para comparar o mês selecionado com o anterior. Ele apresenta entradas, saídas, saldo, diferença absoluta e percentual das despesas, maior estabelecimento, gráficos e os lançamentos mais recentes. A tela de contas lista os lançamentos em tabela, permite busca e filtros e oferece edição e exclusão por item. O cadastro manual permite escolher `ENTRADA` ou `SAIDA`. Como a API não fornece categoria, a distribuição usa estritamente o campo de local/descrição.

## Verificação

```bash
npm run lint
npm test
npm run build
```

Para executar a versão de produção:

```bash
npm start
```
