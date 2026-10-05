import { useState } from "react";
import { useCrear } from "../hooks/usePeticiones";

const campo =
  "w-full rounded-2xl border border-borde bg-panel/80 px-4 py-3 placeholder:text-suave/70";

export function NuevaPeticion() {
  const [nombre, setNombre] = useState("");
  const [texto, setTexto] = useState("");
  const crear = useCrear();

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    crear.mutate(
      { nombre, texto },
      { onSuccess: () => { setNombre(""); setTexto(""); } },
    );
  };

  return (
    <form onSubmit={enviar} className="mx-auto mt-10 flex max-w-xl flex-col gap-3">
      <h2 className="text-xl font-semibold">Agrega tu petición</h2>
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80}
        placeholder="Tu nombre" aria-label="Tu nombre" required className={campo} />
      <textarea value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={1000}
        rows={4} placeholder="¿Por qué quieres que oremos?" aria-label="Tu petición" className={campo} />
      {crear.error && <p role="alert" className="text-sm text-red-400">{crear.error.message}</p>}
      <button type="submit" disabled={!nombre.trim() || crear.isPending}
        className="rounded-2xl bg-linear-to-br from-azul to-violeta px-5 py-3 font-semibold disabled:opacity-50">
        {crear.isPending ? "Enviando…" : "Enviar petición"}
      </button>
    </form>
  );
}
