import React from "react";
import ReactDOM from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App";
import "./styles.css";

const config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  audience: import.meta.env.VITE_AUTH0_AUDIENCE,
};

const root = ReactDOM.createRoot(document.getElementById("root")!);

if (!config.domain || !config.clientId || !config.audience) {
  root.render(
    <main className="setup-screen">
      <div className="setup-card">
        <span className="brand-mark">e.</span>
        <p className="eyebrow">CONFIGURAÇÃO NECESSÁRIA</p>
        <h1>Conecte seu projeto ao Auth0</h1>
        <p>
          Defina <code>VITE_AUTH0_DOMAIN</code>, <code>VITE_AUTH0_CLIENT_ID</code> e{" "}
          <code>VITE_AUTH0_AUDIENCE</code> no arquivo <code>.env</code> local ou nas variáveis de
          ambiente da Vercel.
        </p>
      </div>
    </main>,
  );
} else {
  root.render(
    <React.StrictMode>
      <Auth0Provider
        domain={config.domain}
        clientId={config.clientId}
        authorizationParams={{
          redirect_uri: `${window.location.origin}/`,
          audience: config.audience,
          scope: "openid profile email",
        }}
        onRedirectCallback={() => {
          window.history.replaceState({}, document.title, window.location.pathname);
        }}
      >
        <App apiUrl={import.meta.env.VITE_API_URL} />
      </Auth0Provider>
    </React.StrictMode>,
  );
}
