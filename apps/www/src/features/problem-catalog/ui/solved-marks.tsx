"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { submissionsApi } from "@binary/api";
import { useSession, withFreshToken } from "@binary/session";

/**
 * Yechilgan masalalar belgisi.
 *
 * Katalog sahifasi SERVERDA render qilinadi va 5 daqiqa keshlanadi —
 * ya'ni ✓ ni o'sha yerda chizib bo'lmaydi: kesh har foydalanuvchi
 * uchun alohida bo'lib ketardi va bitta odamning yechganlari
 * boshqasiga ko'rinib qolishi mumkin edi.
 *
 * Shuning uchun ro'yxat mijozda, sahifa chizilgandan KEYIN olinadi va
 * ustidan qo'yiladi. Natijada jadval darrov ko'rinadi, belgilar esa
 * bir lahzadan keyin paydo bo'ladi — bu keshlangan sahifa uchun
 * to'lanadigan halol narx.
 */
const SolvedContext = createContext<ReadonlySet<number>>(new Set());

export function SolvedProvider({ children }: { children: ReactNode }) {
	const { status } = useSession();
	const [solved, setSolved] = useState<ReadonlySet<number>>(new Set());

	useEffect(() => {
		// Anonim foydalanuvchi uchun so'rov umuman yuborilmaydi: u
		// baribir 401 qaytarardi va konsolni bekorga ifloslantirardi.
		if (status !== "authenticated") {
			setSolved(new Set());
			return;
		}

		let cancelled = false;
		withFreshToken((token) => submissionsApi.getSolved({ token }))
			.then((result) => {
				if (!cancelled) setSolved(new Set(result.problem_ids));
			})
			.catch(() => {
				// Xato jim yutiladi: ✓ — qo'shimcha ma'lumot, uning
				// yo'qligi sahifani buzmaydi. Xato xabari esa
				// katalogni ochgan odamga hech narsa bermaydi.
				if (!cancelled) setSolved(new Set());
			});

		return () => {
			cancelled = true;
		};
	}, [status]);

	return <SolvedContext.Provider value={solved}>{children}</SolvedContext.Provider>;
}

/**
 * Bitta qatordagi belgi.
 *
 * Server komponenti ichida ishlatiladi: jadval serverda chiziladi,
 * faqat shu kichik bo'lak client'da yashaydi.
 */
export function SolvedMark({ problemId }: { problemId: number }) {
	const t = useTranslations("problems");
	const solved = useContext(SolvedContext);

	if (!solved.has(problemId)) return null;

	return (
		<span className="font-bold text-success" title={t("solvedMark")}>
			✓<span className="sr-only">{t("solvedMark")}</span>
		</span>
	);
}
