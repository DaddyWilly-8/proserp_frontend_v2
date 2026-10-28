const LOCALE_PREFIX = /^\/[a-z]{2}-[A-Z]{2}(?=\/|\?|#|$)/;

/**
 * Re-points an app path at the active locale, e.g. `/en-US/accounts/ledgers`
 * becomes `/sw-TZ/accounts/ledgers`. Paths without a locale prefix are returned as-is.
 */
export const localizePath = <T extends string | undefined>(path: T, lang: string): T => {
  if (!path || !lang) return path;
  return path.replace(LOCALE_PREFIX, `/${lang}`) as T;
};
