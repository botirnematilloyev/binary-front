/**
 * `problem-catalog` feature'ning ommaviy yuzasi.
 *
 * Sahifalar shu fayldan import qiladi, `ui/` yoki `model.ts` dan
 * to'g'ridan-to'g'ri emas. Bu backenddagi qoidaning ko'zgusi: modulning
 * ichki tuzilishi uning shartnomasi emas.
 */
export { ProblemTable } from "./ui/problem-table";
export { SubjectFilter } from "./ui/subject-filter";
export { difficultyTone, pickName, toProblemRow } from "./model";
export type { ProblemRow } from "./model";
