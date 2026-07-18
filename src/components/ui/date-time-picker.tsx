import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateTimePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  minDate?: Date
  placeholder?: string
  className?: string
}

// Selector de fecha y hora — composición de Popover + Calendar (shadcn) más un
// input de hora nativo, ya que el registro base-vega no trae un bloque de
// "date-picker" instalable, solo la documentación de cómo componerlo.
export function DateTimePicker({
  value,
  onChange,
  minDate,
  placeholder = "Selecciona fecha y hora",
  className,
}: DateTimePickerProps) {
  function handleSelectDate(date: Date | undefined) {
    if (!date) {
      onChange(undefined)
      return
    }

    const next = new Date(date)
    const reference = value ?? new Date()
    next.setHours(reference.getHours(), reference.getMinutes(), 0, 0)
    onChange(next)
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const [hours, minutes] = e.target.value.split(":").map(Number)
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return

    const next = new Date(value ?? new Date())
    next.setHours(hours, minutes, 0, 0)
    onChange(next)
  }

  const timeValue = value ? format(value, "HH:mm") : ""

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "w-full max-w-72 justify-start text-left font-normal",
              !value && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <CalendarIcon className="h-4 w-4" />
        {value ? format(value, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es }) : <span>{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          locale={es}
          selected={value}
          onSelect={handleSelectDate}
          disabled={minDate ? { before: minDate } : undefined}
        />
        <div className="border-t border-border p-3">
          <Input type="time" value={timeValue} onChange={handleTimeChange} />
        </div>
      </PopoverContent>
    </Popover>
  )
}
