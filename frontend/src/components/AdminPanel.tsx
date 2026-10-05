import { useState } from "react";
import { useAuth } from "../auth";

export function AdminPanel() {
  const { isAdmin, login, logout } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (isAdmin) {
    return (
      <button onClick={logout} className="text-sm text-suave underline">
        Cerrar sesión de administrador
      </button>
    );
  }

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)} className="text-sm text-suave underline">
        Soy administrador
      </button>
    );
  }

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(password);
      setPassword("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    }
  };

  return (
    <form onSubmit={enviar} className="flex flex-wrap items-center justify-center gap-2">
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña" aria-label="Contraseña de administrador" autoFocus
        className="rounded-xl border border-borde bg-panel px-3 py-2 text-sm" />
      <button type="submit" className="rounded-xl bg-azul px-4 py-2 text-sm font-semibold">Entrar</button>
      {error && <p role="alert" className="w-full text-center text-sm text-red-400">{error}</p>}
    </form>
  );
}
