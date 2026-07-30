/**
 * Tema reyestri.
 *
 * Nomlar TS turida yashaydi, CSS'da emas — shunda tema tanlagichni
 * qo'lda to'ldirish kerak bo'lmaydi va `tokens.css` da mavjud bo'lmagan
 * temaga o'tish kompilyatsiyada ushlanadi.
 */

export const THEMES = [{ name: "light", label: "Kunduzgi" }] as const;

export type ThemeName = (typeof THEMES)[number]["name"];

export const DEFAULT_THEME: ThemeName = "light";

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
  document.documentElement.dataset.theme=known.indexOf(t)>-1?t:${JSON.stringify(DEFAULT_THEME)};
}catch(e){document.documentElement.dataset.theme=${JSON.stringify(DEFAULT_THEME)};}})();
`.trim();
