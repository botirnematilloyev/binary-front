import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.binary.uz").replace(
	/\/$/,
	"",
);

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			/*
			 * Filtr va sahifalash URL'lari bloklanMAYDI.
			 *
			 * `Disallow: /*?` yozish jozibali ko'rinadi — go'yo crawl budjeti
			 * tejaladi. Lekin masalalar aynan `?page=2` orqali topiladi: bloklasak
			 * Google ikkinchi sahifadagi masalalarga yetib bormaydi. Dublikat
			 * muammosini `canonical` allaqachon hal qiladi, va bu to'g'ri
			 * vosita: canonical "buni indeksla" deydi, robots esa "buni
			 * O'QIMA" deydi — o'qilmagan sahifadan canonical ham ko'rinmaydi.
			 */
		},
		sitemap: `${siteUrl}/sitemap.xml`,
		/*
		 * `admin.binary.uz` bu yerda ko'rsatilmaydi: u alohida host va o'z
		 * `robots.txt` iga ega bo'ladi. Nginx allaqachon unga
		 * `X-Robots-Tag: noindex` yuboradi.
		 */
	};
}
