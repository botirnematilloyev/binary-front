import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const config: NextConfig = {
	// Workspace paketlari TypeScript manba holida keladi (build qadami yo'q),
	// shuning uchun ularni Next o'zi kompilyatsiya qiladi. Har paketga
	// alohida build sozlash mumkin edi, lekin bu ikkita build zanjirini
	// va source map muammosini keltirib chiqaradi.
	transpilePackages: ["@binary/api", "@binary/tokens", "@binary/ui"],

	// Prodda nginx ortida ishlaydi va konteynerda yig'iladi.
	output: "standalone",

	// `X-Powered-By: Next.js` — hujumchiga texnologiya va versiya haqida
	// bepul ma'lumot. Backendda ham shu tamoyil: xato xabari ichki
	// tafsilotni oshkor qilmaydi.
	poweredByHeader: false,

	typedRoutes: true,
};

// Plugin `src/i18n/request.ts` ni topib, server komponentlariga tarjima
// kontekstini ulab beradi.
export default createNextIntlPlugin("./src/i18n/request.ts")(config);
