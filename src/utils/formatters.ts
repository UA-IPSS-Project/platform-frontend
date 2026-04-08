export const formatarCategoria = (categoria: string | undefined | null): string => {
  if (!categoria) return '';
  return categoria.replace(/_/g, ' ').toUpperCase();
};
