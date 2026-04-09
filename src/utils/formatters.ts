export const formatarCategoria = (categoria: string | undefined | null): string => {
  if (!categoria) return '';
  return categoria.replace(/_/g, ' ').toUpperCase();
};

export const normalizeString = (str: string): string => {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};
