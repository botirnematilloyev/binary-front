"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/*
 * 3D sahna DINAMIK yuklanadi va serverda umuman render qilinmaydi.
 *
 * Narxi shuni talab qiladi: `three` ~150 KB (gzip) va model yana
 * ~317 KB. Ular bosh sahifaning boshlang'ich to'plamiga tushsa, birinchi
 * ochilish sezilarli sekinlashardi — holbuki maskot sahifaning ishlashi
 * uchun kerak emas, u bezak. `ssr: false` esa majburiy: `three` `window`
 * va WebGL kontekstiga tayanadi.
 *
 * Bu CodeMirror bilan bir xil mulohaza: og'ir narsa faqat kerak
 * bo'lganda va faqat brauzerda yuklanadi.
 */
const MascotScene = dynamic(() => import("./scene"), { ssr: false });

/**
 * Bosh sahifadagi maskot.
 *
 * Sahna DARROV chiziladi (u birinchi ekranda turibdi), `IntersectionObserver`
 * esa faqat uni TO'XTATISH uchun ishlatiladi: sahifa pastiga tushilganda
 * render halqasi o'chadi va GPU ko'rinmayotgan narsa uchun ishlamaydi.
 *
 * Boshlang'ich qiymat `true` — ya'ni kuzatuvchi biror sababdan
 * ishlamasa ham (ba'zi muhitlarda u umuman chaqirilmaydi), maskot
 * baribir ko'rinadi. Teskarisi qilingan edi va aynan shu tuzoqqa
 * tushdi: kuzatuvchi jim qolib, ekranda hech narsa chiqmasdi.
 */
export function Mascot() {
	const t = useTranslations("home");
	const box = useRef<HTMLDivElement>(null);

	const [visible, setVisible] = useState(true);
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReduced(media.matches);

		const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, []);

	useEffect(() => {
		const node = box.current;
		if (node === null) return;

		/*
		 * `IntersectionObserver` — scroll hodisasiga obuna bo'lishdan
		 * afzal: u brauzerning o'zida hisoblanadi va har piksel
		 * siljishda JS ishga tushmaydi.
		 */
		const observer = new IntersectionObserver(
			([entry]) => setVisible(entry?.isIntersecting ?? false),
			{ rootMargin: "200px" },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			ref={box}
			/*
			 * Balandlik QAT'IY va sahna yuklanguncha ham shunday qoladi:
			 * aks holda model kelganda sahifa "sakrab" ketardi.
			 */
			className="relative h-[320px] w-full select-none lg:h-[380px]"
			aria-label={t("mascotAlt")}
			role="img"
		>
			<MascotScene reduced={reduced} paused={!visible} />
		</div>
	);
}
