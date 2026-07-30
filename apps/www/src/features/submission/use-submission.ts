"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	ApiError,
	ApiTransportError,
	submissionsApi,
	type SubmissionDto,
} from "@binary/api";
import { useSession } from "@/features/auth";

/**
 * Xato KODI qaytariladi, tarjima qilingan matn emas.
 *
 * Hook i18n'ni bilmasligi kerak: shunda uni sinash uchun tarjima
 * konteksti kerak bo'lmaydi, va bir xil kod turli joyda turlicha
 * ko'rsatilishi mumkin (masalan toast va inline matn).
 */
export type SubmitErrorCode =
	| "offline"
	| "tooLarge"
	| "tooManyPending"
	| "loginRequired"
	| "genericError";

/**
 * Holat DISKRIMINATSIYALANGAN union bilan.
 *
 * `{ loading: boolean; error: string | null; data: T | null }` shakli
 * mumkin bo'lmagan kombinatsiyalarga yo'l qoldiradi — masalan bir vaqtda
 * `error` ham, `data` ham to'ldirilgan holat. Union esa har fazada
 * QAYSI maydonlar mavjudligini tur darajasida belgilaydi.
 */
export type SubmitState =
	| { phase: "idle" }
	| { phase: "submitting" }
	| { phase: "watching"; submission: SubmissionDto }
	| { phase: "final"; submission: SubmissionDto }
	/** Juda uzoq davom etdi — natija yo'q emas, shunchaki hali kelmagan. */
	| { phase: "timeout"; submission: SubmissionDto }
	| { phase: "error"; code: SubmitErrorCode };

/*
 * Polling oralig'i o'sib boradi.
 *
 * Backend hujjatida yozilgan xavf: kontest paytida 1000 kutuvchi har
 * sekundda so'rov yuborsa, bu 1000 RPS. Baholash odatda 1–5 sekund
 * oladi, ya'ni birinchi so'rovlar tez, keyingilari sekin bo'lishi
 * mantiqiy — natija darhol kelsa foydalanuvchi kutmaydi, kelmasa esa
 * serverni bekorga urmaymiz.
 */
const POLL_DELAYS_MS = [800, 1000, 1300, 1700, 2200, 2800];
const POLL_MAX_MS = 90_000;

export function useSubmission(slug: string) {
	const { getToken, status: sessionStatus } = useSession();
	const [state, setState] = useState<SubmitState>({ phase: "idle" });

	// Har yangi yuborish oldingi pollingni bekor qiladi. Usiz eski
	// yechimning javobi kech kelib yangisining natijasini bosib ketardi.
	const generation = useRef(0);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const stop = useCallback(() => {
		generation.current++;
		if (timer.current) clearTimeout(timer.current);
		timer.current = null;
	}, []);

	// Komponent yo'q qilinganda taymer qolmasin: aks holda React
	// o'chirilgan komponentga `setState` chaqirilganini aytib ogohlantiradi,
	// va so'rovlar bekorga davom etadi.
	useEffect(() => stop, [stop]);

	const watch = useCallback(
		(id: number, startedAt: number, attempt: number, mine: number) => {
			const delay = POLL_DELAYS_MS[Math.min(attempt, POLL_DELAYS_MS.length - 1)] ?? 2800;

			timer.current = setTimeout(async () => {
				if (mine !== generation.current) return;

				const token = getToken();
				if (!token) {
					setState({ phase: "error", code: "loginRequired" });
					return;
				}

				try {
					const submission = await submissionsApi.getSubmission(id, { token });
					if (mine !== generation.current) return;

					if (submission.is_final) {
						setState({ phase: "final", submission });
						return;
					}

					if (Date.now() - startedAt > POLL_MAX_MS) {
						setState({ phase: "timeout", submission });
						return;
					}

					setState({ phase: "watching", submission });
					watch(id, startedAt, attempt + 1, mine);
				} catch {
					if (mine !== generation.current) return;
					// Bitta so'rov yiqilishi baholash to'xtaganini bildirmaydi
					// (tarmoq uzilishi, 502). Shuning uchun darhol xatoga
					// o'tmaymiz — vaqt tugagunicha davom etamiz.
					if (Date.now() - startedAt > POLL_MAX_MS) {
						setState({ phase: "error", code: "genericError" });
						return;
					}
					watch(id, startedAt, attempt + 1, mine);
				}
			}, delay);
		},
		[getToken],
	);

	const submit = useCallback(
		async (language: string, sourceCode: string) => {
			stop();
			const mine = generation.current;

			if (sessionStatus !== "authenticated") {
				setState({ phase: "error", code: "loginRequired" });
				return;
			}

			const token = getToken();
			if (!token) {
				setState({ phase: "error", code: "loginRequired" });
				return;
			}

			setState({ phase: "submitting" });

			try {
				const submission = await submissionsApi.submit(slug, { language, sourceCode }, { token });
				if (mine !== generation.current) return;

				// Judge shunchalik tez bo'lishi mumkin (biz 20 ms ko'rdik),
				// shuning uchun birinchi javob allaqachon yakuniy bo'lishi
				// mumkin — bunda polling umuman boshlanmaydi.
				if (submission.is_final) {
					setState({ phase: "final", submission });
					return;
				}

				setState({ phase: "watching", submission });
				watch(submission.id, Date.now(), 0, mine);
			} catch (cause) {
				if (mine !== generation.current) return;
				setState({ phase: "error", code: codeFor(cause) });
			}
		},
		[slug, sessionStatus, getToken, stop, watch],
	);

	const reset = useCallback(() => {
		stop();
		setState({ phase: "idle" });
	}, [stop]);

	return { state, submit, reset };
}

function codeFor(cause: unknown): SubmitErrorCode {
	if (cause instanceof ApiTransportError) return "offline";

	if (cause instanceof ApiError) {
		// 413 — backend `ErrSourceTooLarge` uchun aynan shu kodni qaytaradi.
		if (cause.status === 413) return "tooLarge";
		if (cause.status === 429) return "tooManyPending";
		if (cause.status === 401) return "loginRequired";
	}

	return "genericError";
}
