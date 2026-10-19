/**
 * Tema reyestri.
 *
 * Nomlar TS turida yashaydi, CSS'da emas — shunda tema tanlagichni
 * qo'lda to'ldirish kerak bo'lmaydi va `tokens.css` da mavjud bo'lmagan
 * temaga o'tish kompilyatsiyada ushlanadi.
 */

export const THEMES = [
	{
		name: "light",
		label: "Kunduzgi",
		dark: false,
		// Tanlagichdagi mini-ko'rinish uchun. Ular tokenlarning NUSXASI:
		// tanlagich BARCHA temalarni bir vaqtda chizadi, CSS o'zgaruvchilar
		// esa faqat joriy temani beradi.
		preview: { canvas: "#fdfdfb", line: "#3f4650", muted: "#dcdcd6", accent: "#2b50d8" },
	},
	{
		name: "night-owl",
		label: "Night Owl",
		dark: true,
		preview: { canvas: "#011627", line: "#d6deeb", muted: "#1d3b53", accent: "#22da6e" },
	},
	{
		name: "aura",
		label: "Aura",
		dark: true,
		preview: { canvas: "#15141b", line: "#edecee", muted: "#3a3653", accent: "#61ffca" },
	},
] as const;

export type ThemeName = (typeof THEMES)[number]["name"];

export const DEFAULT_THEME: ThemeName = "light";

/** Tizim qorong'i rejimda bo'lsa va foydalanuvchi hali tanlamagan bo'lsa. */
export const DEFAULT_DARK_THEME: ThemeName = "night-owl";

export const THEME_STORAGE_KEY = "binary:theme";

/**
 * `<head>` ichida, React'dan OLDIN ishlaydigan skript.
 *
 * Bu bloklovchi inline skript ataylab: temani React o'rnatsa, foydalanuvchi
 * avval light sahifani, keyin sakrab o'zgarishini ko'radi (FOUC). Bu ayni
 * paytda hydration nomuvofiqligini ham keltirib chiqaradi, chunki server
 * qaysi tema tanlanganini bilmaydi.
 *
 * `try/catch` shart: Safari'ning maxfiy rejimida `localStorage` ga
 * murojaat istisno tashlaydi va u butun sahifani sindiradi.
 */
export const themeInitScript = `
(function(){try{
  var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
  var known=${JSON.stringify(THEMES.map((t) => t.name))};
  if(known.indexOf(t)<0)t=matchMedia("(prefers-color-scheme: dark)").matches?${JSON.stringify(DEFAULT_DARK_THEME)}:${JSON.stringify(DEFAULT_THEME)};
  document.documentElement.dataset.theme=t;
}catch(e){document.documentElement.dataset.theme=${JSON.stringify(DEFAULT_THEME)};}})();
`.trim();

export function isThemeName(value: unknown): value is ThemeName {
	return THEMES.some((t) => t.name === value);
}
