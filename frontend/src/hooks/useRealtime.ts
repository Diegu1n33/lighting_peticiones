import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { KEY, quitar, upsert } from "../cache";
import type { WsEvent } from "../types";

/** Mantiene el caché sincronizado con el WebSocket y reconecta con backoff. */
export function useRealtime() {
  const qc = useQueryClient();
  const [enVivo, setEnVivo] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reintentos = 0;
    let timer: number | undefined;
    let ping: number | undefined;
    let cerrado = false;

    const conectar = () => {
      const proto = location.protocol === "https:" ? "wss" : "ws";
      ws = new WebSocket(`${proto}://${location.host}/api/ws`);

      ws.onopen = () => {
        reintentos = 0;
        setEnVivo(true);
        qc.invalidateQueries({ queryKey: KEY }); // recupera lo perdido mientras estuvo caído
        ping = window.setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) ws.send("ping");
        }, 25_000);
      };

      ws.onmessage = (e) => {
        const ev = JSON.parse(e.data) as WsEvent;
        if (ev.type === "deleted") quitar(qc, ev.id);
        else upsert(qc, ev.peticion);
      };

      ws.onclose = () => {
        setEnVivo(false);
        window.clearInterval(ping);
        if (!cerrado) {
          timer = window.setTimeout(conectar, Math.min(1000 * 2 ** reintentos++, 15_000));
        }
      };
    };

    conectar();
    return () => {
      cerrado = true;
      window.clearTimeout(timer);
      window.clearInterval(ping);
      ws?.close();
    };
  }, [qc]);

  return enVivo;
}
