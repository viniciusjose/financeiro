export function getSafeRedirect(searchParams: URLSearchParams): string {
  const redirect = searchParams.get("redirect");

  if (redirect?.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }

  return "/";
}

export function appendRedirect(path: string, redirect: string | null): string {
  if (!redirect) {
    return path;
  }

  return `${path}?redirect=${encodeURIComponent(redirect)}`;
}
