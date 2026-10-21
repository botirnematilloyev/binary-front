"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Container, Panel } from "@binary/ui";
import { AdminOnly } from "@/features/admin-auth";
import { UserDetail } from "@/features/user-admin";
import { AdminHeader } from "@/widgets/admin-header";

/*
 * `/foydalanuvchilar/korish?id=12` — `/foydalanuvchilar/[id]` emas:
 * panel statik eksport qilinadi va dinamik marshrut build paytida
 * qaysi ID borligini bilmaydi (`next.config.ts` ga qarang).
 */
export default function UserPage() {
	return (
		<>
			<AdminHeader />
			<Container className="py-8">
				<AdminOnly>
					{/* `useSearchParams` statik eksportda Suspense talab qiladi. */}
					<Suspense fallback={<div className="h-64 animate-pulse rounded-card bg-surface-muted" />}>
						<UserFromQuery />
					</Suspense>
				</AdminOnly>
			</Container>
		</>
	);
}

function UserFromQuery() {
	const raw = useSearchParams().get("id");
	const id = Number(raw);

	if (!raw || !Number.isInteger(id) || id <= 0) {
		return (
			<Panel className="px-5 py-6">
				<p className="font-semibold">Foydalanuvchi ko'rsatilmagan</p>
			</Panel>
		);
	}

	// `key` — boshqa foydalanuvchiga o'tganda (mentor havolasi) holat yangidan.
	return <UserDetail key={id} id={id} />;
}
