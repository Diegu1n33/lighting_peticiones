import { useEffect, useState } from "react";

export function FontSizeControl() {
  const [size, setSize] = useState(() => Number(localStorage.getItem("tamano-texto")) || 18);

  useEffect(() => {
    document.documentElement.style.setProperty("--tamano-texto", `${size}px`);
    localStorage.setItem("tamano-texto", String(size));
  }, [size]);

  return (
    <label className="flex items-center justify-center gap-3 text-suave">
      <span className="text-sm">A</span>
      <input type="range" min={14} max={30} value={size}
        onChange={(e) => setSize(Number(e.target.value))}
        aria-label="Tamaño del texto" className="w-48 accent-azul" />
      <span className="text-xl">A</span>
    </label>
  );
}
