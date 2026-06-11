export const CATEGORY_COLOR_PALETTE = [
  { hex: "#E85D4C", label: "Coral" },
  { hex: "#EC4899", label: "Rosa" },
  { hex: "#F59E0B", label: "Âmbar" },
  { hex: "#10B981", label: "Verde" },
  { hex: "#3B82F6", label: "Azul" },
  { hex: "#6366F1", label: "Índigo" },
  { hex: "#8B5CF6", label: "Violeta" },
  { hex: "#64748B", label: "Ardósia" },
  { hex: "#94A3B8", label: "Cinza" },
  { hex: "#0D253D", label: "Ink" },
  { hex: "#533AFD", label: "Primary" },
  { hex: "#14B8A6", label: "Teal" },
] as const;

export type CategoryColorHex = (typeof CATEGORY_COLOR_PALETTE)[number]["hex"];

export const CATEGORY_COLOR_HEXES = CATEGORY_COLOR_PALETTE.map((item) => item.hex);

export function isPaletteColor(color: string): color is CategoryColorHex {
  return (CATEGORY_COLOR_HEXES as readonly string[]).includes(color);
}
