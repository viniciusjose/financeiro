import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveDateFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

function ResponsiveDateField({
  value,
  onChange,
  placeholder = "Selecione a data",
  disabled,
  id,
}: ResponsiveDateFieldProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Input
        id={id}
        type="date"
        value={value}
        disabled={disabled}
        max={new Date().toISOString().slice(0, 10)}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <DatePicker
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

export { ResponsiveDateField };
