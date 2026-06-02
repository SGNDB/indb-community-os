export function withLocale(locale: string, path: string): string {
  const prefix = `/${locale}`;
  if (path === "/" || path === "") return prefix;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const queryIndex = normalized.indexOf("?");
  if (queryIndex !== -1) {
    return `${prefix}${normalized.slice(0, queryIndex)}${normalized.slice(queryIndex)}`;
  }
  return `${prefix}${normalized}`;
}
