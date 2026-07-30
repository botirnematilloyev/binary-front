"use client";

import { Button, Container } from "@binary/ui";

/**
 * Route darajasidagi xato chegarasi.
 *
 * `error.message` KO'RSATILMAYDI. Ikki sabab: prodda Next uni baribir
 * yashiradi ("An error occurred in the Server Components render"), va
 * ko'rsatilgan taqdirda ham u API'ning ichki tafsilotini oshkor qilishi
 * mumkin. Backendda ham shu tamoyil: 500 javobi ichki xabarni chiqarmaydi.
 */
export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
	return (
		<Container className="py-24 text-center">
			<h1 className="text-[28px] font-bold">Nimadir ishlamadi</h1>
			<p className="mx-auto mt-2 max-w-[440px] text-fg-muted">
				Sahifani yuklashda xatolik yuz berdi. Qayta urinib ko'ring — muammo
				davom etsa, birozdan keyin qayting.
			</p>
			<div className="mt-6">
				<Button variant="outline" onClick={reset}>
					Qayta urinish
				</Button>
			</div>
		</Container>
	);
}
