# Entre nós — Frontend

Aplicação React + TypeScript para consultar e cadastrar avaliações, usando Auth0 para login e a API Java deste projeto.

## Requisitos

- Node.js 20.19+ ou 22.12+
- Uma aplicação **Single Page Application** no Auth0
- API de avaliações acessível por HTTPS em uma URL pública

> A API da EC2 está vinculada a `127.0.0.1:8080` e ainda não possui uma URL pública HTTPS. Antes de usar o site publicado, configure um domínio e um proxy HTTPS para encaminhar as requisições `/avaliacoes` à API. Não exponha a porta 8080 diretamente na internet.

## Executar localmente

1. Copie `.env.example` para `.env`. O domínio e o Client ID da SPA Auth0 já estão preenchidos; `VITE_API_URL` ficará pendente até a API ter um endereço HTTPS público.
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
| `VITE_AUTH0_DOMAIN` | `dev-cfz5e0arc3y56xsi.us.auth0.com`. |
| `VITE_AUTH0_CLIENT_ID` | Client ID da SPA `Sistema Avaliações - Front`, configurado em `.env.example`. |
| `VITE_AUTH0_AUDIENCE` | Identifier da API Auth0: `https://simulado-backend`. |
| `VITE_AUTH0_ROLES_CLAIM` | Claim de roles usada pela Action; o padrão é `https://simulado-backend.example.com/roles`. |
| `VITE_API_URL` | URL base HTTPS da API, sem `/avaliacoes` no final. |

O botão de cadastro só aparece se o access token incluir a role `ADMIN`. A API continua sendo a autoridade final e valida novamente a permissão no servidor. A listagem requer a role `USER` ou `ADMIN`.

## Publicar na Vercel

1. Envie este diretório para o repositório GitHub `simulado-frontend`.
2. Na Vercel, escolha **Add New > Project**, importe o repositório e use o preset **Vite**. O `vercel.json` define `npm run build`, saída `dist` e `npm install`.
3. Em **Project Settings > Environment Variables**, cadastre `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE`, `VITE_AUTH0_ROLES_CLAIM` e `VITE_API_URL` para Production (e Preview, se necessário). Essas variáveis são incorporadas ao bundle do navegador; não coloque segredos nelas.
4. Faça o primeiro deploy do site e copie o domínio HTTPS atribuído pela Vercel. O site de login poderá ser publicado antes da API, mas a listagem e o cadastro só funcionarão depois que ela tiver uma URL pública HTTPS.
5. Adicione o domínio Vercel a **Allowed Callback URLs**, **Allowed Logout URLs** e **Allowed Web Origins** da SPA no Auth0.
6. Configure `CORS_ALLOWED_ORIGINS` no backend com a origem exata do site, por exemplo `https://simulado-frontend.vercel.app`, e reinicie o serviço.
7. Teste login com um usuário que tenha `USER` para listar e outro com `ADMIN` para cadastrar.

O domínio/API precisa ser HTTPS e acessível pelo navegador do usuário. Configurar somente o `VITE_API_URL` não publica a API nem remove a necessidade de CORS.
