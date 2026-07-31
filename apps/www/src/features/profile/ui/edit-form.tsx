"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { profileApi, type DistrictDto, type MeDto, type RegionDto } from "@binary/api";
import { withFreshToken } from "@binary/session";
import { Button } from "@binary/ui";
import { describeError, pickName } from "../model";

/**
 * Handle, ism va joylashuvni tahrirlash.
 *
 * `username` ilgari tahrirlanmasdi va foydalanuvchi avtomatik
 * yaratilgan `user_b64b78…` bilan qolib ketardi. Tekshiruv (format,
 * kichik harf, band nomlar) FAQAT backendda: uni bu yerda takrorlash
 * ikki qoidani yaratardi va ular albatta ajralib ketardi. Bu yerdagi
 * yagona "tekshiruv" — `pattern` atributi orqali brauzerning o'z
 * ogohlantirishi, ya'ni tarmoqqa chiqmasdan darrov ko'rinadigan izoh.
 */
export function EditForm({
	me,
	apiLang,
	onSaved,
	onCancel,
}: {
	me: MeDto;
	apiLang: string;
	onSaved: (next: MeDto) => void;
	onCancel: () => void;
}) {
	const t = useTranslations("profile");

	const [username, setUsername] = useState(me.username);
	const [fullName, setFullName] = useState(me.full_name ?? "");
	const [regionId, setRegionId] = useState<number | null>(me.region_id);
	const [districtId, setDistrictId] = useState<number | null>(me.district_id);

	const [regions, setRegions] = useState<RegionDto[]>([]);
	const [districts, setDistricts] = useState<DistrictDto[]>([]);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		profileApi
			.listRegions()
			.then((result) => setRegions(result.regions))
			.catch(() => setRegions([]));
	}, []);

	/*
	 * Tumanlar viloyatga bog'liq. Viloyat tanlanmagan bo'lsa so'rov
	 * umuman yuborilmaydi — 208 ta tumanning to'liq ro'yxati hech
	 * kimga kerak emas.
	 */
	useEffect(() => {
		if (regionId === null) {
			setDistricts([]);
			return;
		}

		let cancelled = false;
		profileApi
			.listDistricts(regionId)
			.then((result) => {
				if (!cancelled) setDistricts(result.districts);
			})
			.catch(() => {
				if (!cancelled) setDistricts([]);
			});

		// Viloyat tez almashtirilsa, kechikkan javob yangisini bosib
		// ketmasligi kerak.
		return () => {
			cancelled = true;
		};
	}, [regionId]);

	async function save() {
		setBusy(true);
		setError(null);
		try {
			const updated = await withFreshToken((token) =>
				profileApi.updateMe(
					{
						// O'zgarmagan handle YUBORILMAYDI: har saqlashda uni
						// qayta yozish keraksiz, va bir kun tanaffus qoidasi
						// qo'shilsa, tegilmagan nom ham "o'zgartirildi" deb
						// hisoblanib qolardi.
						...(username.trim() === me.username ? {} : { username: username.trim() }),
						// Bo'sh satr `null` ga: backendda maydon nullable va
						// bo'sh satr "ism bor, lekin u yo'q" degan ma'nosiz holat.
						fullName: fullName.trim() === "" ? null : fullName.trim(),
						regionId,
						// Viloyat tozalansa tuman ham tozalanadi: backend
						// tumanning viloyatga tegishliligini tekshiradi va
						// yakuniy holatni rad etardi.
						districtId: regionId === null ? null : districtId,
					},
					{ token },
				),
			);
			onSaved(updated);
		} catch (cause) {
			setError(describeError(cause));
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<label className="block">
				<span className="text-sm font-semibold">
					{t("username")}{" "}
					<span className="font-normal text-fg-muted">{t("usernameHint")}</span>
				</span>
				<input
					value={username}
					onChange={(event) => setUsername(event.target.value)}
					className={`${inputClass} font-mono`}
					autoComplete="username"
					spellCheck={false}
					minLength={3}
					maxLength={32}
					pattern="[a-zA-Z0-9](?:[a-zA-Z0-9_\-]*[a-zA-Z0-9])?"
				/>
			</label>

			<label className="block">
				<span className="text-sm font-semibold">{t("fullName")}</span>
				<input
					value={fullName}
					onChange={(event) => setFullName(event.target.value)}
					className={inputClass}
					autoComplete="name"
				/>
			</label>

			<label className="block">
				<span className="text-sm font-semibold">{t("region")}</span>
				<select
					value={regionId ?? ""}
					onChange={(event) => {
						const next = event.target.value === "" ? null : Number(event.target.value);
						setRegionId(next);
						setDistrictId(null);
					}}
					className={inputClass}
				>
					<option value="">{t("notChosen")}</option>
					{regions.map((region) => (
						<option key={region.id} value={region.id}>
							{pickName(region.name, apiLang)}
						</option>
					))}
				</select>
			</label>

			<label className="block">
				<span className="text-sm font-semibold">{t("district")}</span>
				<select
					value={districtId ?? ""}
					onChange={(event) =>
						setDistrictId(event.target.value === "" ? null : Number(event.target.value))
					}
					disabled={regionId === null}
					className={`${inputClass} disabled:bg-surface-muted disabled:text-fg-muted`}
				>
					<option value="">{t("notChosen")}</option>
					{districts.map((district) => (
						<option key={district.id} value={district.id}>
							{pickName(district.name, apiLang)}
						</option>
					))}
				</select>
			</label>

			{error !== null && (
				<p role="alert" className="text-sm text-danger sm:col-span-2 lg:col-span-4">
					{error}
				</p>
			)}

			<div className="flex gap-2 sm:col-span-2 lg:col-span-4">
				<Button size="sm" onClick={() => void save()} disabled={busy}>
					{busy ? t("saving") : t("save")}
				</Button>
				<Button variant="outline" size="sm" onClick={onCancel} disabled={busy}>
					{t("cancel")}
				</Button>
			</div>
		</div>
	);
}

const inputClass =
	"mt-1.5 w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-sm focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";
