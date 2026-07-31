/**
 * `problem-catalog` feature'ning ommaviy yuzasi.
 *
 * Sahifalar shu fayldan import qiladi, `ui/` yoki `model.ts` dan
 * to'g'ridan-to'g'ri emas. Bu backenddagi qoidaning ko'zgusi: modulning
 * ichki tuzilishi uning shartnomasi emas.
 */
export { ProblemTable } from "./ui/problem-table";
export { CatalogSidebar } from "./ui/catalog-sidebar";
export { difficultyTone, filterQuery, pickName, toProblemRow } from "./model";
export type { CatalogFilters, CatalogQuery, ProblemRow } from "./model";
