import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { inputVariants } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { appNavItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function AppSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) {
        return;
      }

      event.preventDefault();
      setOpen((current) => !current);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (href: string) => {
    navigate(href);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          inputVariants({ variant: "trigger" }),
          "h-9 cursor-pointer text-muted-foreground",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <SearchIcon className="size-4 shrink-0" />
          <span className="truncate sm:hidden">Buscar</span>
          <span className="hidden truncate sm:inline">Pesquisar...</span>
        </span>
        <Kbd className="hidden bg-primary px-1.5 text-on-primary sm:inline-flex">⌘K</Kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Pesquisar páginas..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Navegação">
            {appNavItems.map((item) => (
              <CommandItem
                key={item.href}
                value={item.title}
                onSelect={() => handleSelect(item.href)}
              >
                <item.icon className={item.iconClassName} />
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
