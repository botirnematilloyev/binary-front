/**
 * Umumiy formatlash.
 *
 * Bu funksiyalar avval `problem-catalog/model.ts` da edi, lekin
 * `submission` ham ularga muhtoj bo'ldi. Feature'dan feature'ga import
 * qilish qoidani buzadi (`features` bir-birini ko'rmaydi), shuning uchun
 * ular `shared` ga chiqarildi. Uchinchi joyda kerak bo'lishi — bu
 * ko'chirish uchun to'g'ri trigger edi; ikkinchi joyda darhol
 * ko'chirmaslik ham to'g'ri, chunki bir marta ishlatiladigan narsani
 * umumlashtirish keraksiz qatlam yasaydi.
 */

/** 1000 → "1 s", 1500 → "1.5 s". Butun bo'lsa kasr ko'rsatilmaydi. */
export function formatSeconds(ms: number): string {
	const seconds = ms / 1000;
	return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)} s`;
}

/** Judge natijasi millisekundda — u yerda "1 s" emas, aniq son kerak. */
export function formatMs(ms: number): string {
	return `${ms} ms`;
}

export function formatMemory(kb: number): string {
	return kb >= 1024 ? `${Math.round(kb / 1024)} MB` : `${kb} KB`;
}
