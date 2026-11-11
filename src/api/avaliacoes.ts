export interface Avaliacao {
  id: string;
  emailAvaliador: string;
  emailAvaliado: string;
  comentariosAvaliacao: string;
  nota: number;
  dataAvaliacao: string;
}

export interface CriarAvaliacao {
  emailAvaliado: string;
  comentariosAvaliacao: string;
  nota: number;
}

interface ApiError {
  error?: string;
  details?: Record<string, string> | string;
}

async function request<T>(apiUrl: string, token: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${apiUrl.replace(/\/+$/, "")}/avaliacoes`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(
      "Não foi possível conectar à API. Verifique a URL, o HTTPS e a configuração de CORS.",
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    if (response.status === 401) {
      throw new Error("Sua sessão expirou. Entre novamente para continuar.");
    }
    if (response.status === 403) {
      throw new Error("Seu usuário não tem permissão para realizar esta ação.");
    }

    const detail =
      typeof body?.details === "string"
        ? body.details
        : body?.details && Object.values(body.details).join(" ");
    throw new Error(detail || body?.error || `A API retornou erro ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

export function listarAvaliacoes(apiUrl: string, token: string): Promise<Avaliacao[]> {
  return request<Avaliacao[]>(apiUrl, token);
}

export function criarAvaliacao(
  apiUrl: string,
  token: string,
  avaliacao: CriarAvaliacao,
): Promise<Avaliacao> {
  return request<Avaliacao>(apiUrl, token, {
    method: "POST",
    body: JSON.stringify(avaliacao),
  });
}
