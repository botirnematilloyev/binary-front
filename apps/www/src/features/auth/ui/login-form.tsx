"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { ApiError, ApiTransportError, authApi } from "@binary/api";
import { Button } from "@binary/ui";
import { useSession } from "@binary/session";

const CODE_LENGTH = 6;

/**
 * Telegram kodi bilan kirish.
 *
 * Email OTP hozircha YO'Q — u ikki qadamli (kod so'rash, keyin
 * tekshirish), ya'ni boshqa holat mashinasi. Bittasini yaxshi qilish
 * ikkitasini yarim qilishdan afzal. Telegram birinchi tanlangani ham
 * bejiz emas: Gmail SMTP kunlik kvotaga ega va u tugaganda kodlar
 * JIMGINA kelmay qo'yadi, Telegram'da esa bunday chegara yo'q.
 */
export function LoginForm({
	next,
	initialCode,
}: {
	next?: string | undefined;
	/** Botdagi «Kirish» tugmasidan kelgan kod (`/kirish?code=…`). */
	initialCode?: string | undefined;
}) {
	const t = useTranslations("auth");
	const { signIn } = useSession();

	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	/**
	 * Bot tugmasidan kelgan kod darhol ishlatiladi — odam uni qayta
	 * yozishi shart emas. Kod bir martalik, shuning uchun URL'dan
	 * o'chiriladi: tarixda qolib, sahifa yangilanganda ikkinchi marta
	 * yuborilmasin. `useRef` — StrictMode'dagi ikkinchi effekt chaqiruvi
	 * ham kodni ikki marta yubormasin.
	 */
	const consumed = useRef(false);
	useEffect(() => {
		if (consumed.current || !initialCode || !/^\d{6}$/.test(initialCode)) return;
		consumed.current = true;

		const url = new URL(window.location.href);
		url.searchParams.delete("code");
		window.history.replaceState(null, "", url.pathname + url.search);

		setCode(initialCode);
		void verify(initialCode);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initialCode]);

	async function onSubmit(event: FormEvent) {
		event.preventDefault();

		if (code.length !== CODE_LENGTH) {
			setError(t("codeTooShort"));
			return;
		}

		await verify(code);
	}

	async function verify(value: string) {
		setPending(true);
		setError(null);

		try {
			const auth = await authApi.verifyTelegramLogin({
				code: value,
				device: { deviceName: "Web", platform: "web" },
			});
			await signIn(auth);

			// `location.assign`, `router.replace` emas — ya'ni to'liq sahifa
			// yuklanishi. Bu yerda u foydali: hamma komponent yangi sessiya
			// bilan qaytadan render qilinadi va yarim yangilangan holat
			// qolmaydi. Yon foydasi — `next` ixtiyoriy yo'l bo'lgani uchun
			// tiplangan router bilan urishish kerak emas.
			window.location.assign(safeNext(next));
		} catch (cause) {
			setError(messageFor(cause, t));
		} finally {
			setPending(false);
		}
	}

	return (
		<form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
			<label htmlFor="code" className="text-sm font-semibold">
				{t("codeLabel")}
			</label>
			<input
				id="code"
				name="code"
				value={code}
				onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
				// `inputMode` telefonlarda raqamli klaviatura chiqaradi;
				// `type="number"` ATAYLAB emas — u strelkalar chiqaradi,
				// boshidagi nolni yo'qotadi va `maxLength` ni e'tiborsiz
				// qoldiradi.
				inputMode="numeric"
				autoComplete="one-time-code"
				autoFocus
				placeholder={t("codePlaceholder")}
				aria-invalid={error !== null}
				aria-describedby={error ? "code-error" : "code-hint"}
				className="w-full max-w-[220px] rounded-control border border-border-strong bg-surface px-3 py-2.5 font-mono text-lg tracking-[0.3em] focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
			/>

			{error ? (
				<p id="code-error" role="alert" className="text-sm text-danger">
					{error}
				</p>
			) : (
				<p id="code-hint" className="text-sm text-fg-muted">
					{t("expiryNote")}
				</p>
			)}

			<div className="mt-1">
				<Button type="submit" disabled={pending || code.length !== CODE_LENGTH}>
					{pending ? t("submitting") : t("submit")}
				</Button>
			</div>
		</form>
	);
}

/**
 * Backend xato XABARLARI ko'rsatilmaydi, faqat status kodi o'giriladi.
 *
 * Sabab: backend xabarlari inglizcha va ishlab chiquvchi uchun
 * ("invalid or expired otp code"). Ularni ruscha yoki o'zbekcha
 * interfeysda ko'rsatish saytni tashlandiq qilib ko'rsatadi. Status kodi
 * esa til bilan bog'liq emas.
 */
function messageFor(cause: unknown, t: (key: string) => string): string {
	if (cause instanceof ApiTransportError) return t("offline");

	if (cause instanceof ApiError) {
		if (cause.status === 429) return t("tooMany");
		if (cause.isClientFault) return t("invalidCode");
	}

	// `ApiContractError` ham shu yerga tushadi — foydalanuvchi uchun bu
	// oddiy nosozlik, lekin biz uchun backend o'zgarganining belgisi.
	return t("genericError");
}

/**
 * `next` — foydalanuvchi qaysi sahifadan kelgani, va u URL'dan keladi,
 * ya'ni ISHONCHSIZ. Tekshirmasak `?next=https://evil.com` ochiq
 * yo'naltirish zaifligi bo'lardi: hujumchi bizning domendan boshlanuvchi
 * havola tarqatib, foydalanuvchini login'dan keyin o'z saytiga tushiradi.
 *
 * `//evil.com` alohida tekshiriladi: brauzer uni protokolsiz TASHQI
 * manzil deb o'qiydi, lekin u `/` bilan boshlanadi va sodda tekshiruvdan
 * o'tib ketadi.
 */
function safeNext(next: string | undefined): string {
	if (!next) return "/masalalar";
	if (!next.startsWith("/") || next.startsWith("//")) return "/masalalar";
	return next;
}
