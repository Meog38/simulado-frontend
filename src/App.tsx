import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ClipboardList,
  LoaderCircle,
  LogOut,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import {
  criarAvaliacao,
  listarAvaliacoes,
  type Avaliacao,
  type CriarAvaliacao,
} from "./api/avaliacoes";
import { tokenHasRole } from "./auth/roles";

const rolesClaim =
  import.meta.env.VITE_AUTH0_ROLES_CLAIM ?? "https://simulado-backend.example.com/roles";

function formatarData(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function iniciais(email: string) {
  return email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join("");
}

function App({ apiUrl }: { apiUrl?: string }) {
  const {
    isAuthenticated,
    isLoading: authLoading,
    user,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0();
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<CriarAvaliacao>({
    emailAvaliado: "",
    comentariosAvaliacao: "",
    nota: 8,
  });

  const carregarAvaliacoes = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const token = await getAccessTokenSilently();
      if (!token) throw new Error("O Auth0 não retornou um token para acessar a API.");
      setIsAdmin(tokenHasRole(token, rolesClaim, "ADMIN"));
      if (!apiUrl) {
        setAvaliacoes([]);
        setError("Login configurado. A listagem será habilitada quando a API tiver uma URL HTTPS pública.");
        return;
      }
      setAvaliacoes(await listarAvaliacoes(apiUrl, token));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar as avaliações.");
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated) void carregarAvaliacoes();
  }, [isAuthenticated, carregarAvaliacoes]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      if (!apiUrl) throw new Error("A API ainda não tem uma URL HTTPS pública configurada.");
      const token = await getAccessTokenSilently();
      if (!token) throw new Error("O Auth0 não retornou um token para acessar a API.");
      const criada = await criarAvaliacao(apiUrl, token, form);
      setAvaliacoes((atual) =>
        [...atual, criada].sort(
          (a, b) => new Date(b.dataAvaliacao).getTime() - new Date(a.dataAvaliacao).getTime(),
        ),
      );
      setForm({ emailAvaliado: "", comentariosAvaliacao: "", nota: 8 });
      setShowForm(false);
      setSuccess("Avaliação enviada. Obrigado por reconhecer o trabalho de alguém.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível enviar a avaliação.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <main className="loading-screen">
        <LoaderCircle className="spin" size={28} aria-label="Carregando" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="welcome-screen">
        <div className="welcome-orb welcome-orb-one" />
        <div className="welcome-orb welcome-orb-two" />
        <div className="welcome-content">
          <a className="brand" href="/" aria-label="Entre nós, início">
            <span className="brand-mark">e.</span>
            <span>entre nós</span>
          </a>
          <div className="welcome-copy">
            <span className="eyebrow light-eyebrow">
              <Sparkles size={14} /> CULTURA DE RECONHECIMENTO
            </span>
            <h1>
              Boas relações
              <br />
              fazem <em>grandes</em>
              <br />
              trabalhos.
            </h1>
            <p>
              Um espaço para compartilhar feedback com cuidado, valorizar conquistas e crescer
              juntos.
            </p>
            <button className="button button-lime button-large" onClick={() => loginWithRedirect()}>
              Entrar na plataforma <ArrowRight size={17} />
            </button>
          </div>
          <div className="welcome-footer">
            <span>Feito para times que crescem juntos.</span>
            <span>01 — 03</span>
          </div>
        </div>
        <aside className="welcome-art" aria-hidden="true">
          <div className="art-grid" />
          <div className="art-orbit orbit-outer" />
          <div className="art-orbit orbit-inner" />
          <div className="art-sun" />
          <div className="art-sticker sticker-top">feedback que aproxima</div>
          <div className="art-sticker sticker-bottom">
            <span className="sticker-star">✳</span> pessoas primeiro
          </div>
          <div className="art-number">01<span>/03</span></div>
        </aside>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand brand-dark" href="/" aria-label="Entre nós, início">
          <span className="brand-mark">e.</span>
          <span>entre nós</span>
        </a>
        <nav className="topnav" aria-label="Navegação principal">
          <a className="nav-link active" href="#avaliacoes">
            Avaliações
          </a>
          <a className="nav-link" href="#sobre">
            Sobre
          </a>
        </nav>
        <div className="profile-menu">
          <span className="profile-avatar">{iniciais(user?.email ?? user?.name ?? "U")}</span>
          <span className="profile-email">{user?.email ?? user?.name}</span>
          {isAdmin && <span className="role-pill">ADMIN</span>}
          <button
            className="icon-button logout-button"
            title="Sair"
            aria-label="Sair"
            onClick={() =>
              logout({ logoutParams: { returnTo: window.location.origin } })
            }
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <main id="avaliacoes" className="page-content">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> UM TIME, MUITAS CONQUISTAS</span>
            <h1>
              Reconhecer também
              <br />
              é <em>fazer parte.</em>
            </h1>
            <p>
              Um registro de quem faz a diferença. Feedbacks sinceros para celebrar conquistas e
              inspirar o próximo passo.
            </p>
            <a className="text-link" href="#lista">
              Ver avaliações <ArrowDown size={15} />
            </a>
          </div>
          <div className="hero-graphic" aria-hidden="true">
            <div className="graphic-halo" />
            <div className="graphic-sun"><span>✳</span></div>
            <div className="graphic-card graphic-card-back">
              <div className="mini-avatar mini-avatar-green">M</div>
              <div className="mini-lines"><i /><i /></div>
              <span className="mini-star">★</span>
            </div>
            <div className="graphic-card graphic-card-front">
              <div className="graphic-card-head">
                <div className="mini-avatar mini-avatar-peach">J</div>
                <span className="mini-tag">RECONHECIMENTO</span>
              </div>
              <p>Seu jeito de colaborar muda o dia de todo mundo.</p>
              <div className="graphic-stars">★★★★★</div>
            </div>
            <span className="graphic-spark spark-one">✳</span>
            <span className="graphic-spark spark-two">✦</span>
            <span className="graphic-caption">gestos que fazem florescer</span>
          </div>
          <span className="hero-index">01 <i /> 03</span>
        </section>

        <section id="lista" className="section-heading">
          <div>
            <span className="eyebrow">O QUE ESTAMOS CONSTRUINDO</span>
            <h2>Vozes do time<span>.</span></h2>
          </div>
          <div className="section-meta">
            <span className="count-badge">{avaliacoes.length.toString().padStart(2, "0")}</span>
            <span>{avaliacoes.length === 1 ? "avaliação" : "avaliações"}</span>
            <span className="meta-divider" />
            <button
              className="icon-button refresh-button"
              onClick={() => void carregarAvaliacoes()}
              disabled={isLoading}
              aria-label="Atualizar avaliações"
              title="Atualizar"
            >
              <RefreshCw size={16} className={isLoading ? "spin" : ""} />
            </button>
          </div>
        </section>

        {error && (
          <div className="notice notice-error" role="alert">
            <span>{error}</span>
            <button className="notice-action" onClick={() => setError("")}>Fechar</button>
          </div>
        )}
        {success && (
          <div className="notice notice-success" role="status">
            <Check size={17} /> <span>{success}</span>
            <button className="notice-action" onClick={() => setSuccess("")}>Fechar</button>
          </div>
        )}

        {isAdmin && (
          <section className={`new-review-card${showForm ? " is-open" : ""}`}>
            <div className="new-review-intro">
              <span className="new-review-icon"><Plus size={19} /></span>
              <div>
                <strong>Tem alguém fazendo a diferença?</strong>
                <span>Transforme reconhecimento em palavras.</span>
              </div>
            </div>
            {!showForm ? (
              <button className="button button-dark" onClick={() => setShowForm(true)}>
                Escrever avaliação <ArrowUpRight size={16} />
              </button>
            ) : (
              <form className="review-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label className="field">
                    <span>QUEM VOCÊ QUER AVALIAR?</span>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="nome@empresa.com"
                      maxLength={320}
                      required
                      value={form.emailAvaliado}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, emailAvaliado: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field score-field">
                    <span>NOTA</span>
                    <span className="select-wrap">
                      <select
                        value={form.nota}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, nota: Number(event.target.value) }))
                        }
                      >
                        {Array.from({ length: 11 }, (_, nota) => (
                          <option key={nota} value={nota}>{nota} / 10</option>
                        ))}
                      </select>
                      <ChevronDown size={15} />
                    </span>
                  </label>
                </div>
                <label className="field">
                  <span>O QUE FEZ ESSA PESSOA SE DESTACAR?</span>
                  <textarea
                    placeholder="Conte sobre uma atitude, colaboração ou conquista..."
                    minLength={1}
                    maxLength={5000}
                    rows={4}
                    required
                    value={form.comentariosAvaliacao}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        comentariosAvaliacao: event.target.value,
                      }))
                    }
                  />
                  <span className="character-count">
                    {form.comentariosAvaliacao.length} / 5000
                  </span>
                </label>
                <div className="form-actions">
                  <button
                    type="button"
                    className="button button-quiet"
                    onClick={() => setShowForm(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="button button-dark" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><LoaderCircle size={16} className="spin" /> Enviando...</>
                    ) : (
                      <>Publicar avaliação <Send size={15} /></>
                    )}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {!isAdmin && (
          <div className="permission-note">
            <ShieldCheck size={17} />
            <span>Você está no modo de leitura. As avaliações são cadastradas por administradores.</span>
          </div>
        )}

        <section className="reviews-section" aria-label="Lista de avaliações">
          {isLoading && avaliacoes.length === 0 ? (
            <div className="empty-state">
              <LoaderCircle className="spin" size={24} />
              <span>Buscando as avaliações do time...</span>
            </div>
          ) : avaliacoes.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon"><MessageCircle size={22} /></span>
              <strong>Esse espaço está começando agora.</strong>
              <span>Quando alguém publicar uma avaliação, ela aparece aqui.</span>
            </div>
          ) : (
            <div className="reviews-grid">
              {avaliacoes.map((avaliacao, index) => (
                <article className="review-card" key={avaliacao.id}>
                  <div className="review-card-top">
                    <span className={`review-avatar avatar-tone-${index % 4}`}>
                      {iniciais(avaliacao.emailAvaliado)}
                    </span>
                    <div className="review-person">
                      <strong>{avaliacao.emailAvaliado}</strong>
                      <span>Avaliando por {avaliacao.emailAvaliador}</span>
                    </div>
                    <time dateTime={avaliacao.dataAvaliacao}>{formatarData(avaliacao.dataAvaliacao)}</time>
                  </div>
                  <p className="review-comment">“{avaliacao.comentariosAvaliacao}”</p>
                  <div className="review-card-bottom">
                    <div className="rating-badge">
                      <Star size={14} fill="currentColor" />
                      <strong>{Number(avaliacao.nota).toLocaleString("pt-BR")}</strong>
                      <span>/ 10</span>
                    </div>
                    <span className="review-kind"><Sparkles size={13} /> Feedback recebido</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="sobre" className="closing-panel">
          <div className="closing-icon"><Users size={20} /></div>
          <div>
            <span className="eyebrow">CADA PESSOA CONTA</span>
            <h3>Um bom trabalho é sempre coletivo.</h3>
          </div>
          <p>O reconhecimento que a gente dá hoje inspira o que construímos amanhã.</p>
          <span className="closing-arrow"><ArrowUpRight size={21} /></span>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand brand-dark" href="/">
          <span className="brand-mark">e.</span>
          <span>entre nós</span>
        </a>
        <span>Feito de pessoas, para pessoas.</span>
        <span className="footer-credit"><ClipboardList size={14} /> CULTURA EM MOVIMENTO</span>
      </footer>
    </div>
  );
}

export default App;
