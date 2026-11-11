import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Tarefa, listarTarefas, criarTarefa, deletarTarefa } from './api/tarefas';

export default function App() {
  const { isAuthenticated, isLoading, user, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0();

  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState('Média');
  const [erro, setErro] = useState<string | null>(null);
  const [carregandoLista, setCarregandoLista] = useState(false);

  const carregar = async () => {
    try {
      setErro(null);
      setCarregandoLista(true);
      const token = await getAccessTokenSilently();
      const dados = await listarTarefas(token);
      setTarefas(dados);
    } catch (err: any) {
      setErro(err.message || 'Falha ao carregar tarefas.');
    } finally {
      setCarregandoLista(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      carregar();
    }
  }, [isAuthenticated]);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErro(null);
      const token = await getAccessTokenSilently();
      await criarTarefa(token, {
        titulo,
        descricao,
        prioridade,
        emailUsuario: user?.email,
      });
      setTitulo('');
      setDescricao('');
      setPrioridade('Média');
      await carregar();
    } catch (err: any) {
      setErro(err.message || 'Falha ao criar tarefa.');
    }
  };

  const handleDeletar = async (id: number) => {
    try {
      setErro(null);
      const token = await getAccessTokenSilently();
      await deletarTarefa(token, id);
      await carregar();
    } catch (err: any) {
      setErro(err.message || 'Falha ao deletar tarefa.');
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Carregando autenticação...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Gerenciador de Tarefas</h1>
        <p>Faça login para visualizar e gerenciar as tarefas do projeto.</p>
        <button onClick={() => loginWithRedirect()}>Entrar com Auth0</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Tarefas do Projeto</h1>
          <small>Logado como: {user?.email}</small>
        </div>
        <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
          Sair
        </button>
      </header>

      {erro && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', marginBottom: '1rem', borderRadius: '4px' }}>
          {erro}
        </div>
      )}

      <form onSubmit={handleCriar} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '6px' }}>
        <h3>Nova Tarefa</h3>
        <input
          type="text"
          placeholder="Título da tarefa"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />
        <textarea
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          required
        />
        <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
          <option value="Baixa">Baixa</option>
          <option value="Média">Média</option>
          <option value="Alta">Alta</option>
        </select>
        <button type="submit">Criar Tarefa</button>
      </form>

      <section>
        <h3>Lista de Tarefas</h3>
        {carregandoLista ? (
          <p>Carregando tarefas...</p>
        ) : tarefas.length === 0 ? (
          <p>Nenhuma tarefa cadastrada.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tarefas.map((t) => (
              <li key={t.id} style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{t.titulo}</strong> <span>({t.prioridade})</span>
                  <p style={{ margin: '0.25rem 0' }}>{t.descricao}</p>
                  <small style={{ color: '#666' }}>Criado por: {t.emailUsuario}</small>
                </div>
                <button onClick={() => handleDeletar(t.id)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                  Deletar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
