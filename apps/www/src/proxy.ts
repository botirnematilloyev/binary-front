import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

/**
 * Til aniqlash va yo'naltirish.
 *
 * Fayl nomi `proxy.ts` — Next 16 da `middleware.ts` konvensiyasi shunday
 * qayta nomlandi va eski nom deprecation ogohlantirishi beradi. Ishlash
 * tartibi o'zgarmagan.
 */
export default createMiddleware(routing);

export const config = {
	/**
	 * Faqat sahifalar. `_next`, statik fayllar va `favicon.ico` chetlab
	 * o'tiladi — ular til bilan bog'liq emas, va har rasm uchun ishlash
	 * sahifa yuklanishini sekinlashtiradi.
	 *
	 * Nuqtali yo'llar (`/logo.png`) ham chiqarib tashlanadi: `public/`
	 * dagi fayl til prefiksi oladigan bo'lsa, `/ru/logo.png` 404 bo'lardi.
	 */
	matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
