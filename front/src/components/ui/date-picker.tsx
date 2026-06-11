import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { ptBR } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import { InputTrigger } from "@/components/ui/input-trigger";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getLocalIsoDate, parseLocalIsoDate } from "@/lib/date";

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

function DatePicker({
  value = "",
  onChange,
  placeholder = "Selecione a data",
  disabled = false,
  id,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseLocalIsoDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <InputTrigger
          id={id}
          disabled={disabled}
          data-placeholder={!selectedDate}
          className={className}
        >
          {selectedDate ? formatDisplayDate(selectedDate) : <span>{placeholder}</span>}
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        </InputTrigger>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          locale={ptBR}
          selected={selectedDate}
          defaultMonth={selectedDate}
          captionLayout="dropdown"
          startMonth={new Date(1900, 0)}
          endMonth={new Date()}
          disabled={{ after: new Date() }}
          onSelect={(date) => {
            if (!date) return;

            onChange(getLocalIsoDate(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
