import { useState } from "react";
import { useActualizar, useEliminar } from "../hooks/usePeticiones";
import type { Peticion } from "../types";

const boton = "rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90";

export function PeticionCard({ peticion, isAdmin }: { peticion: Peticion; isAdmin: boolean }) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(peticion.nombre);
  const [texto, setTexto] = useState(peticion.texto);
  const actualizar = useActualizar();
  const eliminar = useEliminar();

  const empezar = () => {
    setNombre(peticion.nombre);
    setTexto(peticion.texto);
    setEditando(true);
  };

  const guardar = () =>
    actualizar.mutate({ id: peticion.id, nombre, texto }, { onSuccess: () => setEditando(false) });

  const borrar = () => {
    if (confirm(`¿Eliminar la petición de ${peticion.nombre}?`)) eliminar.mutate(peticion.id);
  };

  return (
    <article className="flex flex-col gap-3 rounded-3xl border border-borde bg-panel/80 p-5 shadow-lg shadow-black/30">
      {editando ? (
        <>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={80}
            aria-label="Nombre"
            className="rounded-xl border border-borde bg-black/30 px-3 py-2 text-lg font-semibold"
          />
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={1000}
            rows={5}
            aria-label="Petición"
            style={{ fontSize: "var(--tamano-texto)" }}
            className="rounded-xl border border-borde bg-black/30 px-3 py-2 leading-relaxed"
          />
          {actualizar.error && <p role="alert" className="text-sm text-red-400">{actualizar.error.message}</p>}
          <div className="flex gap-2">
            <button onClick={guardar} disabled={!nombre.trim() || actualizar.isPending}
              className={`${boton} bg-linear-to-br from-azul to-violeta disabled:opacity-50`}>
              Guardar cambios
            </button>
            <button onClick={() => setEditando(false)} className={`${boton} border border-borde`}>
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="break-words text-xl font-semibold">{peticion.nombre}</h2>
          <p
            style={{ fontSize: "var(--tamano-texto)" }}
            className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words leading-relaxed text-white/90"
          >
            {peticion.texto || <span className="text-suave">Sin texto todavía.</span>}
          </p>
          <div className="mt-auto flex gap-2 pt-2">
            <button onClick={empezar} className={`${boton} border border-borde`}>Editar</button>
            {isAdmin && (
              <button onClick={borrar} disabled={eliminar.isPending}
                className={`${boton} border border-red-500/50 text-red-300`}>
                Eliminar
              </button>
            )}
          </div>
        </>
      )}
    </article>
  );
}
