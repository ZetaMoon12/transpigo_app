import * as React from "react"

import { cn } from "@/lib/utils"

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  thousands?: boolean
  suffix?: string
  min?: number
  placeholder?: string
  className?: string
  id?: string
  "aria-invalid"?: boolean
}

function formatDisplay(value: number, thousands?: boolean) {
  // El backend a veces serializa decimales como string (ej. "15000.00");
  // se normaliza aquí para no depender de que el llamador ya lo convirtió.
  const num = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(num)) return ""
  return thousands ? num.toLocaleString("es-CO") : String(num)
}

/**
 * Input numérico controlado como texto: evita el comportamiento inconsistente
 * de `type="number"` con ceros iniciales y soporta separador de miles.
 */
function NumberInput({
  value,
  onChange,
  thousands,
  suffix,
  min,
  placeholder,
  className,
  id,
  ...props
}: NumberInputProps) {
  const [display, setDisplay] = React.useState(() => formatDisplay(value, thousands))
  const focused = React.useRef(false)

  React.useEffect(() => {
    if (!focused.current) setDisplay(formatDisplay(value, thousands))
  }, [value, thousands])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "")
    if (digits === "") {
      setDisplay("")
      onChange(0)
      return
    }
    const num = Number(digits)
    setDisplay(formatDisplay(num, thousands))
    onChange(num)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    focused.current = true
    if (e.target.value === "0") e.target.select()
  }

  const handleBlur = () => {
    focused.current = false
    const num = typeof value === "number" ? value : Number(value)
    const safe = Number.isFinite(num) ? num : 0
    const clamped = min !== undefined ? Math.max(min, safe) : safe
    if (clamped !== value) onChange(clamped)
    setDisplay(formatDisplay(clamped, thousands))
  }

  return (
    <div className={cn("relative flex items-center", className)}>
      <input
        type="text"
        inputMode="numeric"
        id={id}
        value={display}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(
          "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all",
          "focus:border-[#5AB507] focus:ring-2 focus:ring-[#5AB507]/10",
          "aria-invalid:border-red-400 aria-invalid:ring-2 aria-invalid:ring-red-400/10",
          suffix && "pr-14"
        )}
        {...props}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 text-xs font-semibold text-slate-400">
          {suffix}
        </span>
      )}
    </div>
  )
}

export { NumberInput }
