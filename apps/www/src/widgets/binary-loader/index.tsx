import { getTranslations } from "next-intl/server";

/** Raqamlar balandligi — `bnry-roll` dagi siljish shu songa bog'liq. */
const LINE = 52;

/*
 * Ikkilik hisoblagich: 0, 1, 10, 11, 100 va yopish uchun yana 0.
 *
 * Oxirgisi ataylab takror — izohi `globals.css` da, `bnry-roll` yonida.
 */
const STEPS = ["0", "1", "10", "11", "100", "0"];

/**
 * Sahifalar orasidagi loader.
 *
 * Ranglar tokenlardan olinadi (`currentColor` va `--color-*`), qattiq
 * yozilgan `#1a1a1a` dan emas — shu tufayli qorong'i mavzu qo'shilganda
 * bu komponentga umuman tegish kerak bo'lmaydi.
 */
export async function BinaryLoader() {
	const t = await getTranslations("common");

	return (
		<div
			className="flex min-h-[50vh] items-center justify-center"
			role="status"
			aria-label={t("loading")}
		>
			<div className="relative flex size-[120px] items-center justify-center text-fg">
				{/*
				 * Halqa: to'liq doira 12% shaffoflikda "yo'l" bo'lib
				 * turadi, ustidagi yoy esa aylanadi. `stroke-dasharray`
				 * yoyning uzunligini beradi — 86px chiziq, 260px bo'shliq,
				 * ya'ni aylananing ~25% i.
				 */}
				<svg viewBox="0 0 120 120" className="bnry-sweep absolute inset-0 size-full">
					<circle
						cx="60"
						cy="60"
						r="55"
						fill="none"
						stroke="currentColor"
						strokeOpacity="0.12"
						strokeWidth="4"
					/>
					<circle
						cx="60"
						cy="60"
						r="55"
						fill="none"
						stroke="currentColor"
						strokeWidth="4"
						strokeLinecap="round"
						strokeDasharray="86 260"
					/>
				</svg>

				{/*
				 * Oyna: bitta qator balandligida va `overflow-hidden` —
				 * ustun surilganda faqat bitta raqam ko'rinadi.
				 */}
				<div
					className="flex flex-col items-center overflow-hidden"
					style={{ height: LINE }}
					aria-hidden
				>
					<div className="bnry-roll flex flex-col items-center">
						{STEPS.map((value, index) => (
							<span
								key={index}
								className="font-mono text-[40px] font-bold"
								style={{ lineHeight: `${LINE}px` }}
							>
								{value}
							</span>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
