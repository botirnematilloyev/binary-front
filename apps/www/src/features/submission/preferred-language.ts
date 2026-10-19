/**
 * Foydalanuvchi tanlagan dasturlash tili — masaladan masalaga o'tganda saqlanadi.
 *
 * Odam odatda bitta tilda yozadi: har yangi masalada C++ ni qayta tanlash
 * ortiqcha qadam. Cookie EMAS, `localStorage`: masala sahifasi serverda
 * keshlanadi (ISR), ya'ni server cookie'ni o'qib, tanlovni HTML'ga qo'ya
 * olmaydi — til baribir mijozda, sahifa ochilgandan keyin o'rnatiladi.
 * Server bu qiymatni bilishi shart emas, shuning uchun har so'rovga
 * cookie qo'shish keraksiz.
 *
 * Xususiy rejimda yoki sayt ma'lumotlari bloklanganda `localStorage`
 * xato tashlaydi — tanlov shunchaki eslab qolinmaydi, yechim yuborish esa
 * ishlayveradi.
 */
const STORAGE_KEY = "binary.language";

export function readPreferredLanguage(): string | null {
	try {
		return window.localStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
}

export function savePreferredLanguage(code: string): void {
	try {
		window.localStorage.setItem(STORAGE_KEY, code);
	} catch {
		// Eslab qolinmasa ham hech narsa buzilmaydi.
	}
}
