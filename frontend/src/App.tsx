import { useAuth } from "./auth";
import { AdminPanel } from "./components/AdminPanel";
import { FontSizeControl } from "./components/FontSizeControl";
import { NuevaPeticion } from "./components/NuevaPeticion";
import { PeticionCard } from "./components/PeticionCard";
import { usePeticiones } from "./hooks/usePeticiones";
import { useRealtime } from "./hooks/useRealtime";

export default function App() {
  const { isAdmin } = useAuth();
  const { data: peticiones, isPending, error } = usePeticiones();
  const enVivo = useRealtime();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <header className="mb-8 rounded-3xl border border-borde bg-white/5 p-8 text-center">
        <img src="/LOGO.png" alt="Logo de la iglesia" className="mx-auto mb-5 w-52 max-w-full" />
        <h1 className="text-4xl font-bold sm:text-5xl">Muro de Peticiones</h1>
        <p className="mt-3 text-lg text-suave">Comparte tus peticiones y oremos juntos 🙏</p>
        <p className="mt-4 text-sm text-suave" role="status">
          <span className={`mr-2 inline-block size-2 rounded-full ${enVivo ? "bg-emerald-400" : "bg-amber-400"}`} />
          {enVivo ? "Actualizando en vivo" : "Reconectando…"}
        </p>
      </header>

      <div className="mb-8"><FontSizeControl /></div>

      <main>
        {isPending && <p className="text-center text-suave">Cargando peticiones…</p>}
        {error && <p role="alert" className="text-center text-red-400">No se pudieron cargar las peticiones.</p>}
        {peticiones?.length === 0 && (
          <p className="text-center text-suave">Aún no hay peticiones. Sé el primero en compartir una.</p>
        )}
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
          {peticiones?.map((p) => <PeticionCard key={p.id} peticion={p} isAdmin={isAdmin} />)}
        </div>
        <NuevaPeticion />
      </main>

      <footer className="mt-12 text-center"><AdminPanel /></footer>
    </div>
  );
}
