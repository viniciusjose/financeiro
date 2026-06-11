export function getUserInitials(name?: string, email?: string) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }

    return parts[0].slice(0, 2).toUpperCase();
  }

  return email?.slice(0, 2).toUpperCase() ?? "?";
}

export function getUserDisplayName(name?: string, email?: string) {
  return name?.trim() || email || "Usuário";
}
