import type { QueryClient } from "@tanstack/react-query";
import type { Peticion } from "./types";

export const KEY = ["peticiones"] as const;

// Idempotentes: se pueden aplicar tanto desde la respuesta HTTP como desde el WebSocket.
export function upsert(qc: QueryClient, p: Peticion) {
  qc.setQueryData<Peticion[]>(KEY, (old = []) =>
    old.some((x) => x.id === p.id) ? old.map((x) => (x.id === p.id ? p : x)) : [p, ...old],
  );
}

export function quitar(qc: QueryClient, id: number) {
  qc.setQueryData<Peticion[]>(KEY, (old = []) => old.filter((x) => x.id !== id));
}
