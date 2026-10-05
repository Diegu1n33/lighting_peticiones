export interface Peticion {
  id: number;
  nombre: string;
  texto: string;
  created_at: string;
  updated_at: string;
}

export type WsEvent =
  | { type: "created" | "updated"; peticion: Peticion }
  | { type: "deleted"; id: number };
