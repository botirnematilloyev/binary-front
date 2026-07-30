import { z } from "zod";
import { request, type RequestOptions } from "../http";

export const roleSchema = z.enum(["user", "setter", "admin"]);
export type Role = z.infer<typeof roleSchema>;

/** Backend `phone` ni ataylab rad etadi: SMS provayderi ulanmagan. */
export const otpProviderSchema = z.enum(["email", "telegram"]);
export type OtpProvider = z.infer<typeof otpProviderSchema>;

const sessionUserSchema = z.object({
	id: z.number().int(),
	username: z.string(),
	full_name: z.string().nullable(),
});

const authSchema = z.object({
	access_token: z.string(),
	refresh_token: z.string(),
	expires_at: z.number().int(),
	user: sessionUserSchema,
});

const meSchema = z.object({
	id: z.number().int(),
	username: z.string(),
	full_name: z.string().nullable(),
	region_id: z.number().int().nullable(),
	district_id: z.number().int().nullable(),
	role: roleSchema,
	created_at: z.number().int(),
});

export type AuthDto = z.infer<typeof authSchema>;
export type MeDto = z.infer<typeof meSchema>;

/**
 * Qurilma ma'lumotlari — barchasi ixtiyoriy. Ular `user_sessions` ga
 * yoziladi va profildagi "Qurilmalar" ro'yxatida ko'rinadi.
 */
export interface DeviceInfo {
	deviceId?: string | undefined;
	deviceName?: string | undefined;
	platform?: string | undefined;
	os?: string | undefined;
}

function deviceBody(device: DeviceInfo = {}) {
	return {
		device_id: device.deviceId ?? null,
		device_name: device.deviceName ?? null,
		platform: device.platform ?? null,
		os: device.os ?? null,
	};
}

export function requestOtp(
	input: { provider: OtpProvider; identifier: string },
	options?: RequestOptions,
) {
	return request("/auth/otp/request", z.object({ status: z.string() }), {
		...options,
		method: "POST",
		body: { provider: input.provider, identifier: input.identifier },
	});
}

export function verifyOtp(
	input: { provider: OtpProvider; identifier: string; code: string; device?: DeviceInfo },
	options?: RequestOptions,
) {
	return request("/auth/otp/verify", authSchema, {
		...options,
		method: "POST",
		body: {
			provider: input.provider,
			identifier: input.identifier,
			code: input.code,
			...deviceBody(input.device),
		},
	});
}

/**
 * Telegram login. Bog'lash qadami yo'q — foydalanuvchi botga `/login`
 * yozadi, bot 6 xonali kod beradi, va ayni shu kod hisobning o'zi bilan
 * bog'lanish vazifasini bajaradi. Kod 2 daqiqa yashaydi va bir marta
 * ishlatiladi.
 */
export function verifyTelegramLogin(
	input: { code: string; device?: DeviceInfo },
	options?: RequestOptions,
) {
	return request("/auth/telegram/verify", authSchema, {
		...options,
		method: "POST",
		body: { code: input.code, ...deviceBody(input.device) },
	});
}

export function refresh(refreshToken: string, options?: RequestOptions) {
	return request("/auth/refresh", authSchema, {
		...options,
		method: "POST",
		body: { refresh_token: refreshToken },
	});
}

export function logout(options: RequestOptions & { token: string }) {
	return request("/auth/logout", z.object({ status: z.string() }), {
		...options,
		method: "POST",
	});
}

/**
 * Rol HAR so'rovda DB'dan o'qiladi, JWT da emas. Frontend uchun oqibati:
 * roldan kelib chiqqan UI'ni tokenga qarab qurmaymiz — `/me` ni
 * so'raymiz. Aks holda ruxsati olib tashlangan foydalanuvchi token
 * amal qilgan vaqt ichida admin tugmalarini ko'rib turardi.
 */
export function getMe(options: RequestOptions & { token: string }) {
	return request("/me", meSchema, options);
}
