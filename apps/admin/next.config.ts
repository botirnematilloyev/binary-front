import type { NextConfig } from "next";

const config: NextConfig = {
	transpilePackages: ["@binary/api", "@binary/session", "@binary/tokens", "@binary/ui"],

	/**
	 * Statik eksport — Node protsessi YO'Q.
	 *
	 * `next build` tayyor HTML/JS chiqaradi va nginx ularni `web/admin`
	 * dan beradi. Serverda 3 yadro bor, judge ikkitasini olib turibdi va
	 * `www` uchun allaqachon bitta Node protsessi ishlaydi — admin uchun
	 * ikkinchisini qo'shish shu mashinada eng qimmat qaror bo'lardi.
	 *
	 * Admin'da SSR'dan yo'qotadigan narsa ham yo'q: sahifalar login
	 * ortida, ya'ni SEO qiymati nol, va ma'lumot baribir tokenli
	 * so'rovlar bilan brauzerdan olinadi.
	 *
	 * NARXI: dinamik marshrutlar (`/masalalar/[id]`) ishlamaydi — build
	 * paytida qaysi ID borligi noma'lum. Shuning uchun identifikatorlar
	 * QUERY'da: `/masalalar/tahrir?id=12`.
	 */
	output: "export",

	// Statik eksportda rasm optimizatsiyasi serverni talab qiladi.
	images: { unoptimized: true },

	poweredByHeader: false,
	typedRoutes: true,
};

export default config;
