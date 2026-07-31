"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { profileApi, type SessionDto } from "@binary/api";
import { withFreshToken } from "@binary/session";
import { Badge } from "@binary/ui";

/**
 * Faol qurilmalar.
 *
 * Uchala namunada ham (42.uz, RoboContest, CSES) bunday ro'yxat yo'q,
 * lekin bizda u ZARUR: akkaunt parolsiz, ya'ni "parolni almashtirib
 * hammani chiqarish" degan odatiy chora mavjud emas. Begona qurilmani
 * uzishning yagona yo'li — shu ro'yxat.
 */
export function Devices({
	sessions,
	onChanged,
}: {
	sessions: SessionDto[];
	onChanged: () => void;
}) {
	const t = useTranslations("profile");
	const [busyID, setBusyID] = useState<number | null>(null);

	async function revoke(session: SessionDto) {
		// Joriy sessiyani uzish = o'zini chiqarish. Buni tasodifan
		// bosish oson, shuning uchun alohida tasdiq.
		if (session.is_current && !window.confirm(t("revokeCurrentConfirm"))) return;

		setBusyID(session.id);
		try {
			await withFreshToken((token) => profileApi.revokeSession(session.id, { token }));
			onChanged();
		} finally {
			setBusyID(null);
		}
	}

	return (
		<section>
			<p className="text-[11px] font-bold tracking-wide text-fg-subtle">{t("devicesTitle")}</p>

			{/*
			 * Ikki qatorli blok, bitta uzun qator emas: yon ustun tor
			 * (320px) va nom + belgi + IP + tugma bir qatorga sig'masdi.
			 * Ilgari tugma `ml-auto` bilan chekkaga surilardi — keng
			 * ekranda bu qator o'rtasida bo'sh joy qoldirardi.
			 */}
			<ul className="mt-3 flex flex-col gap-3">
				{sessions.map((session) => (
					<li
						key={session.id}
						className="border-b border-border-default pb-3 last:border-0 last:pb-0"
					>
						<div className="flex items-center justify-between gap-2">
							<span className="truncate text-sm font-semibold">
								{session.device_name ?? t("unknownDevice")}
							</span>

							<button
								type="button"
								onClick={() => void revoke(session)}
								disabled={busyID === session.id}
								className="shrink-0 cursor-pointer text-[13px] font-semibold text-fg-muted transition-colors hover:text-danger disabled:opacity-50"
							>
								{t("revoke")}
							</button>
						</div>

						<div className="mt-1 flex flex-wrap items-center gap-2">
							{session.is_current && (
								<Badge tone="success" size="sm">
									{t("currentDevice")}
								</Badge>
							)}
							<span className="font-mono text-[12px] text-fg-muted">
								{[session.platform, session.os, session.ip_address]
									.filter(Boolean)
									.join(" · ")}
							</span>
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}
