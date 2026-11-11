# Entre nós — Frontend

Aplicação React + TypeScript para consultar e cadastrar avaliações, usando Auth0 para login e a API Java deste projeto.

## Requisitos

- Node.js 20.19+ ou 22.12+
- Uma aplicação **Single Page Application** no Auth0
- API de avaliações acessível por uma URL pública ou por um proxy da Vercel

> Para este exercício, a Vercel encaminha `/api/*` para `http://3.221.155.116:8080/*`. Isso usa HTTP entre a Vercel e a EC2. A API atualmente escuta apenas em `127.0.0.1:8080`, então essa rewrite só funcionará depois que a API aceitar conexões pela interface de rede e a porta 8080 estiver acessível no Security Group da EC2. O token Auth0 também atravessa esse trecho sem criptografia; use HTTPS para qualquer ambiente real.

## Executar localmente

1. Opcionalmente, copie `.env.example` para `.env` para sobrescrever a configuração Auth0 padrão. Em produção, o front usa `/api` por padrão; localmente, defina `VITE_API_URL` quando houver uma API disponível.
2. No Auth0, abra **Applications > Applications**, crie ou selecione uma aplicação do tipo **Single Page Application** e, em **Settings**, configure:
   - **Allowed Callback URLs:** `http://localhost:5173` e o domínio Vercel depois do deploy.
   - **Allowed Logout URLs:** `http://localhost:5173` e o domínio Vercel depois do deploy.
   - **Allowed Web Origins:** `http://localhost:5173` e o domínio Vercel depois do deploy.
3. Use o **Domain** do tenant em `VITE_AUTH0_DOMAIN` (sem `https://` nem barra final), **Client ID** em `VITE_AUTH0_CLIENT_ID` e o **Identifier** da API em `VITE_AUTH0_AUDIENCE`.
4. Instale e execute:

   ```bash
   npm install
   npm run dev
   ```

### Variáveis de ambiente

| Variável | Valor |
|---|---|
| `VITE_AUTH0_DOMAIN` | Domínio Auth0; padrão `dev-cfz5e0arc3y56xsi.us.auth0.com`. |
| `VITE_AUTH0_CLIENT_ID` | Client ID da SPA; padrão configurado em `.env.example`. |
| `VITE_AUTH0_AUDIENCE` | Identifier da API Auth0; padrão `https://simulado-backend`. |
| `VITE_AUTH0_ROLES_CLAIM` | Claim de roles usada pela Action; o padrão é `https://simulado-backend.example.com/roles`. |
| `VITE_API_URL` | URL base da API, sem `/avaliacoes` no final. Em produção, o padrão `/api` usa a rewrite da Vercel. |

O botão de cadastro só aparece se o access token incluir a role `ADMIN`. A API continua sendo a autoridade final e valida novamente a permissão no servidor. A listagem requer a role `USER` ou `ADMIN`.

## Publicar na Vercel

1. Envie este diretório para o repositório GitHub `simulado-frontend`.
2. Na Vercel, escolha **Add New > Project**, importe o repositório e use o preset **Vite**. O `vercel.json` define `npm run build`, saída `dist` e `npm install`.
3. Opcionalmente, em **Project Settings > Environment Variables**, configure `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE`, `VITE_AUTH0_ROLES_CLAIM` e `VITE_API_URL` para Production (e Preview, se necessário). Os três primeiros já têm valores padrão para este projeto. Essas variáveis são incorporadas ao bundle do navegador; não coloque segredos nelas.
4. Faça o deploy do site. A rewrite `/api/*` encaminha as chamadas para o IP da EC2; a listagem e o cadastro só responderão quando a porta 8080 estiver acessível e o serviço aceitar conexões externas.
5. Adicione o domínio Vercel a **Allowed Callback URLs**, **Allowed Logout URLs** e **Allowed Web Origins** da SPA no Auth0.
6. Configure `CORS_ALLOWED_ORIGINS` no backend com a origem exata do site, por exemplo `https://simulado-frontend-seven.vercel.app`, e reinicie o serviço.
7. Teste login com um usuário que tenha `USER` para listar e outro com `ADMIN` para cadastrar.

Esta configuração de proxy HTTP é apenas para o exercício. Ela não publica a porta EC2 nem altera o endereço de bind da aplicação. Para produção, use um endpoint HTTPS para a API e restrinja o acesso de rede.
