# Frontend — Entre nós

SPA React + TypeScript + Vite para consultar e cadastrar avaliações. A
autenticação de usuário é feita no Auth0; o frontend solicita access tokens para
a API e os envia em chamadas HTTP. O backend Java está no repositório
[`Meog38/simulado-backend`](https://github.com/Meog38/simulado-backend/blob/main/README.md).

Este README documenta o estado atual e serve também como guia de adaptação caso
este código seja reaproveitado em outra aplicação, com outro modelo de usuários,
roles, permissões, API e telas.

> **Atenção — proxy HTTP temporário do exercício:** em produção, o cliente usa
> `/api` e a Vercel reescreve `/api/*` para
> `http://3.221.155.116:8080/*`. Isso torna a chamada same-origin para o
> navegador, mas o trecho Vercel → EC2 é HTTP. O token Bearer passa por esse
> trecho sem criptografia. A API da EC2 está temporariamente bindada em
> `0.0.0.0:8080` e a porta está publicamente acessível. Não use essa topologia
> para dados reais; veja [deploy e rede](#6-deploy-na-vercel-e-caminho-da-api).

## 1. O que a aplicação faz hoje

- Exibe uma landing page e opções de login/logout.
- Faz login por redirect ao Universal Login Auth0.
- Após autenticar, obtém um access token para audience `https://simulado-backend`.
- Busca `GET /avaliacoes` e mostra as avaliações.
- Mostra o formulário de criação somente quando identifica `ADMIN` no access
  token.
- Envia `POST /avaliacoes` com `emailAvaliado`, `comentariosAvaliacao` e `nota`.
- O backend determina o e-mail do avaliador a partir do token; o navegador não
  deve enviar essa identidade como campo confiável.

Regras reais de autorização são aplicadas pelo backend. A verificação de role no
frontend só controla a experiência e a visibilidade do formulário: qualquer
usuário pode alterar JavaScript no navegador, então ela nunca substitui a
autorização da API.

## 2. Estrutura e arquivos importantes

| Caminho | Responsabilidade |
|---|---|
| `src/main.tsx` | Monta React, configura `Auth0Provider`, audience, redirect e URL da API. |
| `src/App.tsx` | Fluxos de login/logout, carregamento, formulário e lista de avaliações. |
| `src/api/avaliacoes.ts` | Tipos do contrato HTTP, montagem de Bearer token e tratamento de erros. |
| `src/auth/roles.ts` | Leitura da claim de roles ou permissions para mostrar controles na UI. |
| `src/styles.css` | Estilos da aplicação. |
| `.env.example` | Exemplo das variáveis de build/local. |
| `vite.config.ts` | Configuração do Vite. |
| `vercel.json` | Build/output da Vercel e rewrite `/api/*` para a EC2. |
| `package.json` | Scripts e dependências. |

É React 18, TypeScript, Vite 8, Auth0 React SDK e Lucide React. Para desenvolver,
Node.js compatível com a versão de Vite instalada (consulte `package.json` e
erros do Vite; prefira Node LTS atual).

## 3. Como o login e o token funcionam

`src/main.tsx` envolve o app com `Auth0Provider`. A configuração corrente é:

| Item | Valor atual |
|---|---|
| Tenant domain | `dev-cfz5e0arc3y56xsi.us.auth0.com` |
| SPA Client ID | `oou8D4bvh1SLe5c8hasZL01G66V41y0n` |
| API audience | `https://simulado-backend` |
| Scope solicitado | `openid profile email` |
| Redirect URI | `window.location.origin` |
| Claim de roles consultada pelo frontend | `https://simulado-backend.example.com/roles` |
| API base em produção | `/api`, salvo se `VITE_API_URL` substituir esse padrão |

Domain, Client ID e audience são valores públicos necessários para uma SPA; não
coloque client secret no frontend. Vite compila variáveis `VITE_*` dentro do
bundle entregue ao navegador. Portanto, **nenhuma variável `VITE_*` é adequada
para senha, private key, client secret ou credencial de servidor**.

Ao chamar a API, `src/api/avaliacoes.ts` acrescenta:

```http
Authorization: Bearer <access-token>
Content-Type: application/json
```

O backend valida o JWT independentemente do que a interface mostra.

## 4. Configuração do Auth0

### Aplicação SPA

No Auth0 Dashboard, em **Applications > Applications**, crie ou selecione uma
aplicação do tipo **Single Page Application**.

Configure as URLs permitidas para cada ambiente:

| Campo da SPA no Auth0 | Local | Produção atual |
|---|---|---|
| Allowed Callback URLs | `http://localhost:5173` | `https://simulado-frontend-seven.vercel.app` |
| Allowed Logout URLs | `http://localhost:5173` | `https://simulado-frontend-seven.vercel.app` |
| Allowed Web Origins | `http://localhost:5173` | `https://simulado-frontend-seven.vercel.app` |

Use a origem exata: scheme, host e porta, sem caminho. Preview deployments
Vercel usam hosts diferentes; adicione-os apenas se realmente pretende autenticar
naquele preview. Depois de alterar URLs permitidas, salve as configurações.

### API e autorização da aplicação

Em **Applications > APIs**, selecione a API cujo Identifier é
`https://simulado-backend`. A SPA precisa estar autorizada a pedir tokens para
essa API por **Application Access** / política de acesso delegado. Neste tenant,
a política está em `Per-app authorization`; foi criado acesso delegado para a
SPA atual.

Se criar outra SPA, não basta copiar seu Client ID para o `.env`: autorize o
novo cliente na API Auth0. Se criar outro backend/API, crie ou selecione seu API
Identifier e mantenha o mesmo valor na configuração do front e do backend.

### Roles, permissions e Action

O frontend lê a claim de roles indicada por `VITE_AUTH0_ROLES_CLAIM` (padrão
`https://simulado-backend.example.com/roles`). Também entende, para controlar a
interface, `permissions`:

- role `ADMIN` ou permission `avaliacoes:write`: habilita a interface de cadastro;
- `src/auth/roles.ts` também sabe reconhecer `USER` e permission
  `avaliacoes:read` se for chamada para verificar leitura. Atualmente `App.tsx`
  chama esse helper apenas para verificar `ADMIN`/`avaliacoes:write`; a leitura
  é tentada para qualquer usuário autenticado e o backend decide se autoriza.

O tenant atual tem uma Action **Adicionar roles e email**, implantada e conectada
ao trigger Post Login. O namespace emitido pela Action precisa ser o mesmo que o
front procura e que o backend valida. Exemplo correspondente ao backend atual:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = "https://simulado-backend.example.com/";
  const roles = event.authorization?.roles ?? [];

  api.accessToken.setCustomClaim(`${namespace}roles`, roles);
  if (event.user.email) {
    api.accessToken.setCustomClaim(`${namespace}email`, event.user.email);
  }
};
```

O frontend usa apenas a claim de roles para condicionar controles; a claim de
e-mail é consumida pelo backend ao criar a avaliação. A Action deve estar
**deployed e conectada ao Login Flow**; uma Action apenas criada na biblioteca
não é executada. As roles devem ser atribuídas ao usuário no Auth0.

Uma opção diferente é trabalhar com permissions. O frontend e o backend
precisam concordar nos nomes das permissions e a API Auth0 precisa emitir o array
`permissions` no access token (RBAC e “Add Permissions in the Access Token”).
Não presuma que roles adicionadas ao usuário aparecem automaticamente em todo
access token: confira o JWT emitido para a API.

### Token inspection sem expor credenciais

Ao depurar, confira no access token:

- `iss`: tenant issuer, idêntico a `AUTH0_ISSUER_URI` no backend.
- `aud`: contém o API Identifier solicitado.
- claim customizada de roles: claim namespace e `ADMIN`/`USER` conforme
  atribuição no Auth0.
- `permissions`, caso use esse modelo.
- claim customizada de e-mail, se o endpoint de criação usa e-mail.

Não compartilhe access/refresh tokens. São credenciais Bearer: quem obtiver um
token ainda válido pode tentar usá-lo até expirar ou ser revogado.

## 5. Executar localmente

### Instalação

Na raiz:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

O Vite normalmente inicia em `http://localhost:5173`. Configure essa URL nos
Allowed Callback URLs, Allowed Logout URLs e Allowed Web Origins da SPA.

Para verificar types e bundle de produção:

```powershell
npm run build
npm run preview
```

### Variáveis de ambiente do frontend

| Variável | Padrão / função |
|---|---|
| `VITE_AUTH0_DOMAIN` | `dev-cfz5e0arc3y56xsi.us.auth0.com`; domain sem `https://` e sem `/` final. |
| `VITE_AUTH0_CLIENT_ID` | `oou8D4bvh1SLe5c8hasZL01G66V41y0n`; Client ID público da SPA. |
| `VITE_AUTH0_AUDIENCE` | `https://simulado-backend`; Identifier da API, não o Client ID nem o Management API. |
| `VITE_AUTH0_ROLES_CLAIM` | `https://simulado-backend.example.com/roles`; claim namespace lida pela UI. |
| `VITE_API_URL` | Base das chamadas, sem `/avaliacoes` no final. Em produção o default é `/api`; em desenvolvimento, se omitida, chamadas ficam desabilitadas. |

O `.env` local é ignorado pelo Git. Não commite valores de ambiente com
credenciais. `VITE_API_URL` pode ser:

- Local, se o backend estiver rodando na máquina, por exemplo
  `http://localhost:8080` (o browser chamará diretamente a API; o backend deve
  aceitar a origem do Vite em CORS).
- URL HTTPS pública da API.
- `/api`, para usar uma rewrite same-origin equivalente à da Vercel se houver
  proxy local configurado.

## 6. Deploy na Vercel e caminho da API

### Deploy da SPA

1. Importe `Meog38/simulado-frontend` na Vercel.
2. A configuração `vercel.json` indica framework Vite, `npm run build`, saída
   `dist` e `npm install`.
3. Configure variáveis `VITE_*` no ambiente **Production** se precisar sobrescrever
   defaults. Vite incorpora os valores no bundle durante o build: depois de
   mudar uma variável, faça um novo deploy.
4. O domínio de produção atual é
   `https://simulado-frontend-seven.vercel.app`.
5. Garanta as URLs permitidas na SPA Auth0, depois faça login para validar o fluxo.

### Rewrite atual

`vercel.json` contém:

```json
{
  "source": "/api/:path*",
  "destination": "http://3.221.155.116:8080/:path*"
}
```

O app usa `/api` como base de produção por padrão, e acrescenta `/avaliacoes`.
Assim:

```text
Frontend:       /api/avaliacoes
Vercel rewrite: /api/:path* -> http://3.221.155.116:8080/:path*
Destino EC2:    http://3.221.155.116:8080/avaliacoes
```

`VITE_API_URL` configurada no projeto Vercel substitui o default `/api`. Para
usar a rewrite atual, mantenha a variável vazia ou configure-a como `/api`.

### Topologia e riscos atuais

```text
Browser --HTTPS--> Vercel /api/avaliacoes --HTTP--> EC2:8080/avaliacoes
```

- O browser fala com a origem HTTPS da Vercel; a chamada é same-origin e evita
  CORS do browser nessa topologia.
- A requisição da Vercel à EC2 é HTTP simples. O token Bearer e o conteúdo da
  API não estão cifrados nesse trecho.
- A EC2 está temporariamente bindada em `0.0.0.0:8080`; o Security Group permite
  conexões externas para que Vercel alcance o serviço.
- Uma resposta `401` sem token indica que o proxy alcançou a API e a API recusou
  corretamente uma chamada não autenticada; não significa que login ou roles
  estão funcionando.
- Para restaurar a exposição segura, a EC2 deve voltar a `127.0.0.1:8080` e a
  regra pública TCP 8080 deve ser removida no Security Group. A rewrite atual
  deixará de funcionar nesse momento; remova-a ou substitua-a por um endpoint
  HTTPS protegido (proxy TLS/load balancer).

Não trate a rewrite como TLS para o backend. Para qualquer dado real, use HTTPS
até a API, restrinja a rede e não exponha diretamente o servidor de aplicação.

## 7. Contrato HTTP e tratamento de erros

Tipos atuais em `src/api/avaliacoes.ts`:

```typescript
interface CriarAvaliacao {
  emailAvaliado: string;
  comentariosAvaliacao: string;
  nota: number;
}
```

O front não envia e-mail de quem está logado como identidade confiável. O
backend obtém isso do token. A resposta da API inclui ID, e-mail do avaliador,
e-mail do avaliado, comentário, nota e data.

O helper de API traduz respostas `401` em erro de sessão inválida e `403` em
falta de permissão. Erros de rede são apresentados como falha de conexão/URL/
HTTPS/CORS. Se o contrato do backend mudar, atualize conjuntamente:

1. interfaces e funções em `src/api/avaliacoes.ts`;
2. formulários, listas e tratamento de estado em `src/App.tsx`;
3. validação correspondente no backend;
4. testes e documentação de ambos os repositórios.

## 8. Adaptar para outra aplicação

O repositório pode servir como referência, mas não é um template genérico pronto.
Ao criar uma aplicação sem relação com avaliações:

### 8.1 Defina a fronteira da API primeiro

- Defina os recursos, endpoints, métodos, contrato JSON e quem pode executar cada
  operação.
- Escolha o API Identifier/Audience do Auth0 para essa API.
- Defina IDs de usuário e dados de perfil necessários. Para identidade duradoura,
  considere usar `sub`, não e-mail como chave primária.
- Decida roles amplas ou permissions específicas. Exemplo de outro domínio:
  roles `OWNER`, `EDITOR`, `VIEWER`; permissions `orders:read`,
  `orders:refund`. Não reutilize essas sugestões sem alinhar às regras reais.
- Especifique o que acontece com usuários sem role, role removida, usuário
  desativado e token já emitido.

### 8.2 Ajuste o Auth0

- Configure aplicação SPA e URLs permitidas para cada ambiente.
- Configure API/resource server, Identifier, assinatura RS256 e política de
  acesso à SPA.
- Crie roles/permissions pertinentes e atribua-as aos usuários.
- Atualize a Post Login Action e a claim namespace.
- Se usar permissions, habilite sua inclusão no access token para a API.
- Valide com tokens novos; mudanças na Action/roles não alteram tokens que já
  foram emitidos.

### 8.3 Ajuste o frontend

- `src/main.tsx`: tenant/domain, Client ID, API audience, scopes e URL base.
- `src/auth/roles.ts`: claim namespace e nomes de roles/permissions. Este arquivo
  só controla apresentação de elementos; não é controle de segurança.
- `src/api/`: endpoints, headers e tipos da API nova.
- `src/App.tsx` ou novos componentes: formulários, lista, navegação e estados
  apropriados ao domínio.
- `.env.example`: documente defaults seguros e variáveis sem credenciais.
- `vercel.json`: atualize/remove rewrite para o host/rota da nova API.
- `README.md`: descreva endpoints, claims, setup local, ambientes e publicação.

### 8.4 Ajuste o backend

No repositório backend, atualize configuração de issuer/audience/claims, conversor
de authorities, regras de endpoint, identidade usada no domínio, entidade,
validação, migrations e testes. Nunca dependa de `isAdmin` do React como
autorização real.

### 8.5 Ambientes e deploy

- Não compartilhe o mesmo audience entre APIs sem uma decisão explícita.
- Use configuração e usuários separados entre dev/test/prod quando possível.
- Configure no backend CORS apenas quando o browser chamar uma origem diferente
  diretamente; proxy same-origin muda essa necessidade, mas não autenticação.
- Configure a URL real da API em Vercel e lembre que variáveis Vite são valores
  de build.
- Teste usuário sem role, role de leitura, role de escrita, token com audience
  errada, token expirado e payload inválido.

## 9. Diagnóstico

| Sintoma | Verificação |
|---|---|
| “Callback URL mismatch” | Redirect URI atual é `window.location.origin`; adicionar exatamente a origem do site às Allowed Callback URLs. |
| Login funciona, mas API retorna `401` | Audience da SPA e do backend? Token é access token para essa API? Header Bearer chega? |
| API retorna `403` | Action conectada ao Post Login Flow? Role/permission atribuída? Namespace e string exatos? Regras do backend? |
| Login funciona, mas cadastro não aparece | O access token contém `ADMIN` na claim que `VITE_AUTH0_ROLES_CLAIM` lê? A UI só analisa o access token. |
| `502` da Vercel | Deploy contém rewrite atual? EC2 está ativa, em bind acessível e Security Group permite o tráfego? IP atual correto? |
| `401` ao testar `/api/avaliacoes` manualmente | Esperado sem Bearer token; prova apenas que o destino respondeu e protege a rota. |
| CORS | Confirme se a chamada é para `/api` same-origin ou para API direta. Confira método, origem e headers do preflight. |
| Mudança de env não aparece | Variáveis `VITE_*` são compiladas; refaça o deployment e confirme o bundle da produção. |
| Usuário criado, mas sem role | Atribua role no Auth0, emita token novo e inspecione a claim. |

## 10. Checklist para uma aplicação nova

- [ ] Definir endpoints e regra de autorização por operação.
- [ ] Escolher Auth0 tenant, SPA, API Identifier e audience.
- [ ] Escolher roles/permissions e a claim namespace.
- [ ] Atribuir roles/permissões a usuários de teste.
- [ ] Configurar/deployar Action e conectar ao Post Login Flow.
- [ ] Configurar callback/logout/web origin de localhost e produção.
- [ ] Atualizar `AUTH0_ISSUER_URI`, `AUTH0_AUDIENCE` e claims no backend.
- [ ] Atualizar `Auth0RolesConverter`, endpoints e testes no backend.
- [ ] Atualizar `VITE_AUTH0_*`, `src/auth/roles.ts` e `src/api/` no frontend.
- [ ] Atualizar CORS ou proxy, sem confundir CORS com controle de acesso.
- [ ] Configurar TLS e rede do backend; não expor HTTP com Bearer token em uso real.
- [ ] Testar tokens e endpoints com usuários autorizados e não autorizados.
- [ ] Atualizar os READMEs dos dois repositórios em conjunto.
