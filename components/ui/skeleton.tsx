export function PageSkeleton() {
  return <div className="skeleton-page" aria-label="Carregando"><div className="skeleton skeleton-title"/><div className="skeleton-grid"><div className="skeleton skeleton-card"/><div className="skeleton skeleton-card"/></div><span className="sr-only">Carregando conteúdo...</span></div>;
}
