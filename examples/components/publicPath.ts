export const DOCS_BASE_PATH =
  process.env.NODE_ENV === 'production' ? '/docs' : '';

export function isDocsDeployment(pathname: string) {
  return Boolean(
    DOCS_BASE_PATH &&
      (pathname === DOCS_BASE_PATH || pathname.startsWith(`${DOCS_BASE_PATH}/`))
  );
}
