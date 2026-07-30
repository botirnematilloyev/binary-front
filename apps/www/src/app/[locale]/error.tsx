"use client";

import { useTranslations } from "next-intl";
import { Button, Container } from "@binary/ui";

/**
 * Route darajasidagi xato chegarasi.
 *
 * `error.message` KO'RSATILMAYDI. Ikki sabab: prodda Next uni baribir
 * yashiradi ("An error occurred in the Server Components render"), va
 * ko'rsatilgan taqdirda ham u API'ning ichki tafsilotini oshkor qilishi
 * mumkin. Backendda ham shu tamoyil: 500 javobi ichki xabarni chiqarmaydi.
 *
 * Bu client komponent, shuning uchun `useTranslations` — server
 * variantidagi `getTranslations` emas.
 */
export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
	const t = useTranslations("error");

	return (
		<Container className="py-24 text-center">
			<h1 className="text-[28px] font-bold">{t("title")}</h1>
			<p className="mx-auto mt-2 max-w-[440px] text-fg-muted">{t("hint")}</p>
			<div className="mt-6">
				<Button variant="outline" onClick={reset}>
					{t("retry")}
				</Button>
			</div>
		</Container>
	);
}
