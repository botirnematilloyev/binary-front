"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { taxonomyApi, type RoadmapDto } from "@binary/api";
import { useSession, withFreshToken } from "@binary/session";
import { RoadmapGraph } from "./roadmap-graph";

/**
 * Yo'l xaritasi va uning ustidagi progress.
 *
 * Sahifa SERVERDA chiziladi va keshlanadi — ya'ni progressni o'sha
 * yerda olib bo'lmaydi: kesh har foydalanuvchi uchun alohida bo'lib
 * ketardi va bittasining yechganlari boshqasiga ko'rinib qolishi
 * mumkin edi. Shuning uchun server MEHMON holatini (graf, mavzular,
 * masalalar soni) beradi, kirgan foydalanuvchi uchun esa o'sha
 * so'rovning o'zi mijozda token bilan takrorlanadi va faqat sonlar
 * almashadi.
 *
 * Bu katalogdagi ✓ belgilari bilan bir xil yechim. Farqi shundaki, bu
 * yerda alohida endpoint kerak emas: `/roadmap` javobi allaqachon
 * kim so'raganiga qarab progressni qo'shib beradi.
 */
export function RoadmapView({
	initial,
	apiLang,
}: {
	initial: RoadmapDto;
	apiLang: string;
}) {
	const t = useTranslations("roadmap");
	const { status } = useSession();
	const [roadmap, setRoadmap] = useState(initial);

	// Server boshqa fanni yuborsa (foydalanuvchi fan almashtirdi),
	// mijozdagi holat eskirib qoladi — shuning uchun u yangi
	// ma'lumotga qaytariladi.
	useEffect(() => {
		setRoadmap(initial);
	}, [initial]);

	useEffect(() => {
		// Mehmon uchun so'rov TAKRORLANMAYDI: serverdan kelgan javob
		// allaqachon aynan shu — progresssiz variant.
		if (status !== "authenticated") return;

		let cancelled = false;
		withFreshToken((token) =>
			taxonomyApi.getRoadmap(initial.subject.slug, { token }),
		)
			.then((fresh) => {
				if (!cancelled) setRoadmap(fresh);
			})
			.catch(() => {
				// Xato jim yutiladi: progress — qo'shimcha ma'lumot,
				// uning yo'qligi chizmani buzmaydi. Foydalanuvchi
				// baribir butun yo'l xaritasini ko'rib turibdi.
			});

		return () => {
			cancelled = true;
		};
	}, [status, initial.subject.slug]);

	return (
		<>
			<p className="mt-4 font-mono text-[13px] text-fg-muted">
				{t("summaryTopics", {
					done: roadmap.done_topics,
					total: roadmap.topics,
				})}
				{" · "}
				{t("summaryProblems", {
					solved: roadmap.solved,
					total: roadmap.total,
				})}
			</p>

			<div className="mt-8">
				<RoadmapGraph nodes={roadmap.nodes} apiLang={apiLang} />
			</div>
		</>
	);
}
