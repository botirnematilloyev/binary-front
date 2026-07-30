import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Til bilan ishlaydigan navigatsiya.
 *
 * Komponentlar `next/link` dan EMAS, shu yerdan import qiladi. Sabab:
 * `next/link` joriy tilni bilmaydi, ya'ni `/ru/masalalar` da turgan
 * foydalanuvchi `<Link href="/masalalar">` bosganda o'zbek tiliga
 * tushib qolardi. Bu jimgina buziladigan xato — hech qanday xato
 * chiqmaydi, shunchaki til yo'qoladi.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
	createNavigation(routing);
