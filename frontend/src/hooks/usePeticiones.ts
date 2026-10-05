import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { KEY, quitar, upsert } from "../cache";

export const usePeticiones = () => useQuery({ queryKey: KEY, queryFn: api.listar });

export function useCrear() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.crear, onSuccess: (p) => upsert(qc, p) });
}

export function useActualizar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; nombre?: string; texto?: string }) =>
      api.actualizar(id, data),
    onSuccess: (p) => upsert(qc, p),
  });
}

export function useEliminar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.eliminar,
    onSuccess: (_, id) => quitar(qc, id),
  });
}
