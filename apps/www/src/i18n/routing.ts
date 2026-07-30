import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE, LOCALE_SEGMENTS } from "@/shared/i18n/locales";

export const routing = defineRouting({
	locales: LOCALE_SEGMENTS,
	defaultLocale: DEFAULT_LOCALE,

	/**
	 * `as-needed`: asosiy til prefikssiz (`/masalalar`), qolganlari
	 * prefiksli (`/ru/masalalar`).
	 *
	 * `always` (ya'ni `/uz/masalalar`) ham to'g'ri variant edi va u
	 * soddaroq — lekin unda bosh sahifa har doim `/uz` ga yo'naltiradi,
	 * ya'ni har birinchi tashrif ortiqcha redirect bilan boshlanadi.
	 * Auditoriyaning aksariyati o'zbek tilida, shuning uchun eng ko'p
	 * yo'lni qisqa qildik.
	 */
	localePrefix: "as-needed",

	/**
	 * Marshrutlar shu yerda E'LON QILINADI.
	 *
	 * Ikki foyda bor. Birinchisi bugun ishlaydi: `next-intl` ning `Link`
	 * i shu ro'yxatga qarab tiplanadi, ya'ni mavjud bo'lmagan yo'lga
	 * havola kompilyatsiyada ushlanadi (Next'ning `typedRoutes` i faqat
	 * `[locale]` bilan ishlaydi va `next-intl` Link'iga ta'sir qilmaydi).
	 *
	 * Ikkinchisi kelajak uchun: yo'l nomini tilga qarab o'zgartirish —
	 * `"/masalalar": { ru: "/zadachi", en: "/problems" }` — shu yerdagi
	 * bitta qatorlik o'zgarish. Hozir tarjima QILINMADI: SEO qiymati
	 * asosan masala sarlavhalarida, bo'lim nomida emas, va har til uchun
	 * alohida yo'l canonical xatolari sathini kengaytiradi.
	 * Trigger: rus tilida kontent 50 masaladan oshsa.
	 */
	pathnames: {
		"/": "/",
		"/masalalar": "/masalalar",
		"/masalalar/[slug]": "/masalalar/[slug]",
	},
});
