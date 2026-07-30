"use client";

import { useSession } from "@binary/session";
import { Button, Container, Panel } from "@binary/ui";
import { LoginForm } from "./login-form";

/**
 * Panelga kirish darvozasi.
 *
 * MUHIM: bu XAVFSIZLIK chegarasi EMAS, qulaylik chegarasi. Statik
 * eksportda butun JS baribir yuklab olinadi, ya'ni tekshiruvni chetlab
 * o'tish qiyin emas. Haqiqiy himoya backendda: har `/admin/*` so'rov
 * `RequireManager` ortida va roli yetmagan foydalanuvchi 403 oladi.
 *
 * Bu darvozaning vazifasi boshqa — roli yetmagan odamga ishlamaydigan
 * tugmalarni ko'rsatmaslik va nima uchun kira olmasligini AYTISH.
 * Chetlab o'tgan odam esa bo'sh jadval va 403 xatolardan boshqa hech
 * narsa ko'rmaydi.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
	const { status, user, signOut } = useSession();

	if (status === "loading") {
		return (
			<Container className="py-24">
				<div className="mx-auto h-24 max-w-[420px] animate-pulse rounded-card bg-surface-muted" />
			</Container>
		);
	}

	if (status === "anonymous") return <LoginForm />;

	// Rol `/me` dan olinadi, tokendan emas — backend uni har so'rovda
	// DB'dan o'qiydi, ya'ni ruxsat olib tashlanganda panel darhol
	// yopilishi kerak.
	const canManage = user?.role === "setter" || user?.role === "admin";

	if (!canManage) {
		return (
			<Container className="py-24">
				<Panel className="mx-auto max-w-[460px] p-6 text-center">
					<h1 className="text-xl font-bold">Ruxsat yo'q</h1>
					<p className="mt-2 text-fg-secondary">
						Bu panel masala muallifi (setter) yoki admin uchun. Sizning
						hisobingiz oddiy foydalanuvchi sifatida ro'yxatdan o'tgan.
					</p>
					<Button variant="outline" className="mt-5" onClick={() => void signOut()}>
						Boshqa hisob bilan kirish
					</Button>
				</Panel>
			</Container>
		);
	}

	return <>{children}</>;
}
