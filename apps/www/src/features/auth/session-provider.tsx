"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { authApi, type AuthDto, type MeDto } from "@binary/api";
import {
	clearSession,
	getAccessToken,
	getRefreshToken,
	refreshSession,
	setSession,
	subscribe,
	watchOtherTabs,
} from "./token-store";

export type SessionStatus = "loading" | "authenticated" | "anonymous";

interface SessionContextValue {
	status: SessionStatus;
	user: MeDto | null;
	/** Login formasi shu orqali sessiyani boshlaydi. */
	signIn: (auth: AuthDto) => Promise<void>;
	signOut: () => Promise<void>;
	/** Har so'rovda qayta o'qiladi — komponentda saqlab qo'yilmaydi. */
	getToken: () => string | null;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
	const [status, setStatus] = useState<SessionStatus>("loading");
	const [user, setUser] = useState<MeDto | null>(null);

	// Bekor qilingan so'rovning javobi kech kelib holatni buzmasligi uchun.
	const generation = useRef(0);

	const loadUser = useCallback(async () => {
		const token = getAccessToken();
		if (!token) {
			setUser(null);
			setStatus("anonymous");
			return;
		}

		const current = ++generation.current;
		try {
			// Rol ATAYLAB `/me` dan olinadi, tokendan emas: backend rolni har
			// so'rovda DB'dan o'qiydi, ya'ni ruxsati olib tashlangan
			// foydalanuvchi darhol o'zgarishni ko'rishi kerak. Tokendagi
			// da'vo esa amal qilish muddati oxirigacha yolg'on gapirardi.
			const me = await authApi.getMe({ token });
			if (current !== generation.current) return;
			setUser(me);
			setStatus("authenticated");
		} catch {
			if (current !== generation.current) return;
			clearSession();
			setUser(null);
			setStatus("anonymous");
		}
	}, []);

	useEffect(() => {
		const unsubscribe = subscribe((auth) => {
			if (auth === null) {
				generation.current++;
				setUser(null);
				setStatus("anonymous");
			} else {
				void loadUser();
			}
		});
		const unwatch = watchOtherTabs();

		// Sahifa yangilangandan keyin sessiyani tiklash. Access token
		// xotirada bo'lgani uchun u yo'qolgan, refresh token esa qolgan.
		if (getRefreshToken()) {
			void refreshSession().then((auth) => {
				if (auth === null) setStatus("anonymous");
				// Muvaffaqiyatli bo'lsa `subscribe` allaqachon `loadUser` ni
				// ishga tushirgan.
			});
		} else {
			setStatus("anonymous");
		}

		return () => {
			unsubscribe();
			unwatch();
		};
	}, [loadUser]);

	const signIn = useCallback(async (auth: AuthDto) => {
		setSession(auth);
		// `subscribe` `loadUser` ni chaqiradi; bu yerda kutish shart emas,
		// lekin chaqiruvchi `await` qilsa login tugaganini bilishi kerak.
		await Promise.resolve();
	}, []);

	const signOut = useCallback(async () => {
		const token = getAccessToken();
		// Serverga xabar berish MUHIM: usiz refresh token DB'da tirik
		// qoladi va access token Redis denylist'iga tushmaydi, ya'ni
		// o'g'irlangan nusxa ishlashda davom etardi. Lekin tarmoq xatosi
		// foydalanuvchini brauzerda tizimda ushlab turmasligi kerak.
		if (token) {
			try {
				await authApi.logout({ token });
			} catch {
				/* mahalliy tozalash baribir bajariladi */
			}
		}
		clearSession();
	}, []);

	const value = useMemo<SessionContextValue>(
		() => ({ status, user, signIn, signOut, getToken: getAccessToken }),
		[status, user, signIn, signOut],
	);

	return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
	const context = useContext(SessionContext);
	if (!context) {
		throw new Error("useSession faqat <SessionProvider> ichida ishlatiladi");
	}
	return context;
}
