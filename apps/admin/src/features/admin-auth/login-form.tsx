"use client";

import { useState, type FormEvent } from "react";
import { ApiError, ApiTransportError, authApi } from "@binary/api";
import { useSession } from "@binary/session";
import { Button, Panel } from "@binary/ui";

const CODE_LENGTH = 6;
const BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT ?? "binary_uz_admin_bot";

/**
 * Admin uchun login formasi.
 *
 * `apps/www` dagi formaga o'xshaydi, lekin ATAYLAB nusxa: u `next-intl`
 * ga tayanadi va to'rt tilda ishlaydi, admin esa bir tilda. Umumiy
 * komponent qilish uchun unga "tarjima funksiyasini tashqaridan ol"
 * degan sozlama qo'shish kerak bo'lardi — ya'ni ikkala ilovada ham
 * murakkabroq kod. Qiymatli qism (sessiya, token, xato turlari)
 * allaqachon `@binary/session` va `@binary/api` da bo'lishiladi;
 * takrorlanayotgani — bir nechta satr matn.
 */
export function LoginForm() {
	const { signIn } = useSession();
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function onSubmit(event: FormEvent) {
		event.preventDefault();
		if (code.length !== CODE_LENGTH) return;

		setPending(true);
		setError(null);
		try {
			const auth = await authApi.verifyTelegramLogin({
				code,
				device: { deviceName: "Admin panel", platform: "web" },
			});
			await signIn(auth);
			// `signIn` foydalanuvchini ham yuklaydi, ya'ni darvoza o'zi
			// qayta render bo'ladi — bu yerda navigatsiya kerak emas.
		} catch (cause) {
			setError(messageFor(cause));
			setPending(false);
		}
	}

	return (
		<div className="mx-auto mt-24 max-w-[420px] px-6">
			<h1 className="text-[26px] font-bold">binary.uz — admin</h1>
			<p className="mt-2 text-fg-secondary">
				Telegram botga <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[13px]">/login</code>{" "}
				yuboring va kodni kiriting.
			</p>

			<Panel className="mt-6 p-5">
				<a
					href={`https://t.me/${BOT}`}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex rounded-control border border-border-strong px-3.5 py-2 text-sm font-semibold transition-colors hover:border-border-hover"
				>
					Botni ochish ↗
				</a>

				<form onSubmit={onSubmit} className="mt-5">
					<label htmlFor="code" className="text-sm font-semibold">
						Kod
					</label>
					<input
						id="code"
						value={code}
						onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
						inputMode="numeric"
						autoComplete="one-time-code"
						autoFocus
						placeholder="000000"
						aria-invalid={error !== null}
						className="mt-1.5 block w-full max-w-[220px] rounded-control border border-border-strong bg-surface px-3 py-2.5 font-mono text-lg tracking-[0.3em] focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
					/>

					{error ? (
						<p role="alert" className="mt-2 text-sm text-danger">
							{error}
						</p>
					) : (
						<p className="mt-2 text-sm text-fg-muted">Kod 2 daqiqa amal qiladi.</p>
					)}

					<Button type="submit" className="mt-3" disabled={pending || code.length !== CODE_LENGTH}>
						{pending ? "Tekshirilyapti…" : "Kirish"}
					</Button>
				</form>
			</Panel>
		</div>
	);
}

/** Backend xabarlari inglizcha va ishlab chiquvchi uchun — status kodini o'giramiz. */
function messageFor(cause: unknown): string {
	if (cause instanceof ApiTransportError) {
		return "Serverga ulanib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring.";
	}
	if (cause instanceof ApiError) {
		if (cause.status === 429) return "Juda ko'p urinish. Bir necha daqiqadan keyin qayting.";
		if (cause.isClientFault) return "Kod noto'g'ri yoki muddati o'tgan. Botdan yangi kod oling.";
	}
	return "Kirishda xatolik yuz berdi. Qayta urinib ko'ring.";
}
