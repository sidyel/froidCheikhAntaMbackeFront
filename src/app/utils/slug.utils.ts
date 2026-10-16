export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildProduitUrl(id: number, nom: string): string {
  return `/produit/${id}-${slugify(nom)}`;
}

export function buildCategorieUrl(id: number, nom: string): string {
  return `/produits/categorie/${id}-${slugify(nom)}`;
}

/** Extrait l'id numérique depuis un param de route "id-slug" ou "id" seul. */
export function extractId(param: string): number {
  return parseInt(param.split('-')[0], 10);
}
