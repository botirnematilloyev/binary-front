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
	getRefreshToken,
	refreshSession,
	setSession,
	subscribe,
	watchOtherTabs,
	withFreshToken,
} from "./token-store";

export type SessionStatus = "loading" | "authenticated" | "anonymous";

interface SessionContextValue {
	status: SessionStatus;
	user: MeDto | null;
	/** Login formasi shu orqali sessiyani boshlaydi. */
	signIn: (auth: AuthDto) => Promise<void>;
	signOut: () => Promise<void>;
	/*
	 * `getToken` ATAYLAB yo'q.
	 *
	 * U bor edi va aynan shu tuzoqni yasadi: komponent tokenni oladi,
	 * lekin u eskirgan bo'lishi mumkin — brauzer fon tabidagi taymerni
	 * sekinlashtirgani uchun yangilash kechikadi. Natijada so'rov 401
	 * oladi va foydalanuvchi "sessiya tugadi" ko'radi, holbuki refresh
	 * token joyida va sahifani yangilash muammoni hal qiladi.
	 *
	 * O'rniga `withFreshToken(...)` ishlatiladi: u so'rov OLDIDAN
	 * muddatni tekshiradi va 401 bo'lsa bir marta qayta uradi.
	 */
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
	const [status, setStatus] = useState<SessionStatus>("loading");
	const [user, setUser] = useState<MeDto | null>(null);

	// Bekor qilingan so'rovning javobi kech kelib holatni buzmasligi uchun.
	const generation = useRef(0);

	const loadUser = useCallback(async () => {
		const current = ++generation.current;
		try {
			// `withFreshToken` — xotiradagi tokenni to'g'ridan-to'g'ri
			// o'qimaymiz. U boshqa tab rotatsiya qilganda bekor qilinadi,
			// va bunda sinxron o'qish `null` qaytarib foydalanuvchini
			// bekordan-bekor "tizimdan chiqqan" qilib ko'rsatardi.
			//
			// Rol ATAYLAB `/me` dan olinadi, tokendan emas: backend rolni har
			// so'rovda DB'dan o'qiydi, ya'ni ruxsati olib tashlangan
			// foydalanuvchi darhol o'zgarishni ko'rishi kerak. Tokendagi
			// da'vo esa amal qilish muddati oxirigacha yolg'on gapirardi.
			const me = await withFreshToken((token) => authApi.getMe({ token }));
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
		// Serverga xabar berish MUHIM: usiz refresh token DB'da tirik
		// qoladi va access token Redis denylist'iga tushmaydi, ya'ni
		// o'g'irlangan nusxa ishlashda davom etardi.
		//
		// `withFreshToken` bu yerda ham kerak: xotiradagi token boshqa tab
		// rotatsiyasidan keyin bekor qilingan bo'lishi mumkin, va sinxron
		// o'qish `null` qaytarib serverga XABAR BERMASDAN o'tib ketardi —
		// ya'ni "chiqdim" bosgan foydalanuvchining sessiyasi serverda
		// tirik qolardi.
		//
		// Tarmoq xatosi esa foydalanuvchini brauzerda tizimda ushlab
		// turmasligi kerak, shuning uchun mahalliy tozalash baribir
		// bajariladi.
		try {
			await withFreshToken((token) => authApi.logout({ token }));
		} catch {
			/* sessiya allaqachon tugagan yoki tarmoq yo'q — muhim emas */
		}
		clearSession();
	}, []);

	const value = useMemo<SessionContextValue>(
		() => ({ status, user, signIn, signOut }),
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
