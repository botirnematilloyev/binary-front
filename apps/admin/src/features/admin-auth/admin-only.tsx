"use client";

import { useSession } from "@binary/session";
import { Panel } from "@binary/ui";

/**
 * Faqat admin (role 3) uchun bo'limlar.
 *
 * `AdminGate` setter'ni ham o'tkazadi — masala yozish uchun shu yetarli.
 * Foydalanuvchilar bo'limi esa shaxsiy ma'lumot ko'rsatadi va backendda
 * `RequireUserManager` ortida turadi; bu yerda setter'ga 403 o'rniga
 * tushunarli xabar ko'rsatiladi. Gate kabi bu ham XAVFSIZLIK chegarasi
 * emas, faqat qulaylik.
 */
export function AdminOnly({ children }: { children: React.ReactNode }) {
	const { user } = useSession();

	if (user?.role !== "admin") {
		return (
			<Panel className="mx-auto max-w-[460px] p-6 text-center">
				<h1 className="text-xl font-bold">Ruxsat yo'q</h1>
				<p className="mt-2 text-fg-secondary">Bu bo'lim faqat admin uchun.</p>
			</Panel>
		);
	}

	return <>{children}</>;
}
