import type { Peticion } from "./types";

const BASE = "/api";
const TOKEN_KEY = "admin_token";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(BASE + path, { ...init, headers });
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event("auth:expired"));
    const detail = await res.json().then((d) => d.detail).catch(() => null);
    const msg =
      res.status === 429
        ? "Demasiados intentos, espera un momento."
        : typeof detail === "string"
          ? detail
          : "Algo salió mal. Intenta de nuevo.";
    throw new ApiError(res.status, msg);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  listar: () => request<Peticion[]>("/peticiones"),
  crear: (data: { nombre: string; texto: string }) =>
    request<Peticion>("/peticiones", { method: "POST", body: JSON.stringify(data) }),
  actualizar: (id: number, data: Partial<Pick<Peticion, "nombre" | "texto">>) =>
    request<Peticion>(`/peticiones/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  eliminar: (id: number) => request<void>(`/peticiones/${id}`, { method: "DELETE" }),
  login: (password: string) =>
    request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
};
