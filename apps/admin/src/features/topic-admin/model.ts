import { ApiError } from "@binary/api";

/**
 * Nom kiritiladigan tillar.
 *
 * Kodlar — backend `jsonb` da ishlatadigan kalitlarning AYNAN o'zi
 * (`uz_cyr`, BCP 47 dagi `uz-Cyrl` emas): bu qiymat API'ga o'zgarishsiz
 * boradi. www ilovasidagi til reyestri URL bo'lagi va BCP 47 ni ham
 * biladi, lekin admin panelda ular kerak emas — bu yerda faqat
 * ma'lumotning o'zi tahrirlanadi.
 */
export const NAME_LANGS = [
	{ code: "uz", label: "O'zbekcha", required: true },
	{ code: "uz_cyr", label: "Ўзбекча (кирилл)", required: false },
	{ code: "ru", label: "Ruscha", required: false },
	{ code: "en", label: "Inglizcha", required: false },
] as const;

export type NameDraft = Record<string, string>;

/**
 * `sort` ATAYLAB yo'q.
 *
 * Ommaviy `GET /topics` javobida `sort` qaytmaydi (u kuratorlik
 * tafsiloti va tashqi mijozga kerak emas — ular baribir tartiblangan
 * ro'yxat oladi). Ya'ni panel mavjud qiymatni O'QIY olmaydi, va uni
 * maydon sifatida ko'rsatish yolg'on bo'lardi: tahrirlashda har doim 0
 * ko'rinib, saqlaganda haqiqiy tartibni bosib ketardi.
 *
 * Shuning uchun panel `sort` ni umuman yubormaydi — yangi mavzu 0 bilan
 * tug'iladi va mavzular `sort, id` bo'yicha, ya'ni amalda qo'shilish
 * tartibida chiqadi. Trigger: mavzular tartibini qo'lda boshqarish
 * kerak bo'lsa, avval admin uchun ro'yxat endpointi kerak.
 */
export interface TopicDraft {
	subjectId: number;
	slug: string;
	name: NameDraft;
	/**
	 * Oldingi mavzular — yo'l xaritasidagi chiziqlar.
	 *
	 * Draft'ning bir qismi, garchi u ALOHIDA so'rov bilan saqlansa ham
	 * (`PUT /admin/topics/{id}/prerequisites`). Sabab foydalanuvchi
	 * tomonda: setter uchun bu bitta forma va bitta "Saqlash" tugmasi;
	 * nechta so'rov ketishi uning muammosi emas.
	 */
	requires: number[];
}

export function emptyDraft(subjectId: number): TopicDraft {
	return { subjectId, slug: "", name: {}, requires: [] };
}

/**
 * Bo'sh tillarni tashlaydi.
 *
 * Backend ham shu ishni qiladi, lekin bu takrorlash emas: `{"ru": ""}`
 * ni yuborish backendda tozalanadi va javobda YO'Q bo'lib qaytadi —
 * ya'ni ekrandagi holat javobdan farq qiladi. Bu yerda tozalash formani
 * javob bilan bir xil qiladi.
 */
export function cleanName(name: NameDraft): NameDraft {
	const cleaned: NameDraft = {};
	for (const [lang, value] of Object.entries(name)) {
		const trimmed = value.trim();
		if (trimmed !== "") cleaned[lang] = trimmed;
	}
	return cleaned;
}

/**
 * Yuborishdan OLDINGI tekshiruv.
 *
 * Backendda ham xuddi shu qoidalar bor va ular haqiqiy himoya — bu esa
 * shunchaki tezlik: setter "Saqlash" ni bosib, tarmoqni kutib, keyin
 * "slug noto'g'ri" degan javob olmasligi uchun. Shuning uchun bu yerda
 * qoida QAT'IYROQ bo'lmasligi kerak, aks holda backend qabul qiladigan
 * qiymat panelda kiritib bo'lmaydigan bo'lib qoladi.
 */
export function validateDraft(draft: TopicDraft): string | null {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) {
		return "Slug faqat kichik lotin harflari, raqamlar va bitta chiziqchadan iborat bo'lishi kerak.";
	}
	if (draft.slug.length < 3 || draft.slug.length > 160) {
		return "Slug 3 tadan 160 tagacha belgi bo'lishi kerak.";
	}
	if ((draft.name["uz"] ?? "").trim() === "") {
		return "O'zbekcha nom majburiy — qolgan tillar ixtiyoriy.";
	}
	if (draft.subjectId <= 0) {
		return "Fan tanlanmagan.";
	}
	return null;
}

/**
 * Backend xatosini o'zbekcha jumlaga aylantiradi.
 *
 * Backend xabarlari inglizcha va API shartnomasining bir qismi — ularni
 * o'zbekchaga o'girish backendning ishi emas (mijozlar ko'p bo'lishi
 * mumkin). Shuning uchun tarjima aynan shu yerda, ko'rsatiladigan joyda.
 */
export function describeError(error: unknown, action: "save" | "delete"): string {
	if (!(error instanceof ApiError)) {
		return "Serverga ulanib bo'lmadi. Qayta urinib ko'ring.";
	}

	if (error.status === 409) {
		if (action === "delete") {
			return "Bu mavzu masalalarga biriktirilgan. Avval o'sha masalalardan olib tashlang.";
		}
		// Ikkala 409 ham "holat to'sqinlik qilyapti" degani, lekin
		// sabablari butunlay boshqa. Backend xabari ularni ajratadi,
		// shuning uchun tarjima ham o'sha xabarga qarab tanlanadi:
		// aks holda halqa haqidagi xato "slug band" bo'lib chiqardi.
		if (error.message.includes("cycle")) {
			return "Bunday bog'lanish halqa hosil qiladi: tanlangan mavzu (bevosita yoki bir necha qadam orqali) shu mavzuning o'zini talab qilyapti.";
		}
		return "Bu slug band — boshqa mavzuda ishlatilyapti.";
	}
	if (error.status === 404) {
		return "Mavzu topilmadi — boshqa birov o'chirgan bo'lishi mumkin.";
	}
	if (error.status === 400) {
		// Backend qaysi tekshiruv yiqilganini aniq aytadi; xabarni
		// yashirmaymiz, chunki panelni setterning o'zi ishlatadi.
		return `So'rov qabul qilinmadi: ${error.message}`;
	}
	if (error.status === 403) {
		return "Bu amal uchun huquqingiz yo'q.";
	}
	return "Kutilmagan xato. Qayta urinib ko'ring.";
}

/** Ko'p tilli nomdan ko'rsatish uchun birini tanlaydi: uz → birinchi. */
export function displayName(name: Record<string, string>): string {
	return name["uz"] ?? Object.values(name)[0] ?? "";
}
