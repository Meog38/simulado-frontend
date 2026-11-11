const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface Tarefa {
  id: number;
  titulo: string;
  descricao: string;
  prioridade: string;
  emailUsuario: string;
  dataCriacao?: string;
}

export interface CriarTarefaPayload {
  titulo: string;
  descricao: string;
  prioridade: string;
  emailUsuario?: string;
}

export async function listarTarefas(token: string): Promise<Tarefa[]> {
  const response = await fetch(`${API_BASE}/tarefa`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erro ao listar tarefas: ${response.status}`);
  }
  return response.json();
}

export async function criarTarefa(token: string, payload: CriarTarefaPayload): Promise<Tarefa> {
  const response = await fetch(`${API_BASE}/tarefa`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Erro ao criar tarefa: ${response.status}`);
  }
  return response.json();
}

export async function deletarTarefa(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/tarefa?id=${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erro ao deletar tarefa: ${response.status}`);
  }
}
