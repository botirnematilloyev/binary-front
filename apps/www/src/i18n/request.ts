import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
	const requested = await requestLocale;

	// `hasLocale` — o'zimiz yozgan tekshiruv emas: URL'dan kelgan qiymat
	// ishonchsiz va `../../etc/passwd` ko'rinishida bo'lishi mumkin, u esa
	// pastdagi `import` ga to'g'ridan-to'g'ri tushardi.
	const locale = hasLocale(routing.locales, requested)
		? requested
		: routing.defaultLocale;

	return {
		locale,
		messages: (await import(`../../messages/${locale}.json`)).default,
	};
});
