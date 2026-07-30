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
import { ApiError, authApi, type AuthDto, type MeDto } from "@binary/api";
import {
	clearSession,
	getRefreshToken,
	refreshSession,
	SessionExpiredError,
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
		} catch (cause) {
			if (current !== generation.current) return;

			/*
			 * FAQAT haqiqiy auth xatosi sessiyani o'chiradi.
			 *
			 * Oldin bu blok `catch { clearSession() }` edi va aynan shu
			 * login'ni buzardi: `signIn` `/me` so'rovini boshlagach sahifa
			 * darhol boshqa manzilga o'tardi, navigatsiya so'rovni BEKOR
			 * qilardi, bekor qilingan so'rov esa istisno tashlardi — va bu
			 * blok uni "sessiya tugadi" deb tushunib refresh tokenni
			 * o'chirardi. Yangi sahifa yuklanganda token yo'q edi.
			 *
			 * Tarmoq uzilishi ham xuddi shunday zararli edi: bir marta
			 * internet uzilsa foydalanuvchi tizimdan chiqib qolardi.
			 */
			const isAuthFailure =
				cause instanceof SessionExpiredError ||
				(cause instanceof ApiError && cause.status === 401);

			if (isAuthFailure) {
				clearSession();
				setUser(null);
				setStatus("anonymous");
				return;
			}

			// Boshqa xato: sessiya tegilmaydi, keyingi urinishda tiklanadi.
			// Holat esa "loading" da qotib qolmasligi kerak.
			setStatus((previous) => (previous === "loading" ? "anonymous" : previous));
		}
	}, []);

	useEffect(() => {
		// Obuna FAQAT sessiya tugashini kuzatadi.
		//
		// Oldin u sessiya paydo bo'lganda ham `loadUser` chaqirardi, ya'ni
		// `signIn` va `refreshSession` ning har biri qo'shimcha `/me`
		// so'roviga sabab bo'lardi. Endi foydalanuvchini KIM sessiyani
		// o'rnatgan bo'lsa, o'sha yuklaydi — bitta sessiya, bitta so'rov.
		const unsubscribe = subscribe((auth) => {
			if (auth !== null) return;
			generation.current++;
			setUser(null);
			setStatus("anonymous");
		});
		const unwatch = watchOtherTabs();

		// Sahifa yangilangandan keyin sessiyani tiklash. Access token
		// xotirada bo'lgani uchun u yo'qolgan, refresh token esa qolgan.
		if (getRefreshToken()) {
			void refreshSession().then((auth) => {
				if (auth === null) setStatus("anonymous");
				else void loadUser();
			});
		} else {
			setStatus("anonymous");
		}

		return () => {
			unsubscribe();
			unwatch();
		};
	}, [loadUser]);

	const signIn = useCallback(
		async (auth: AuthDto) => {
			setSession(auth);
			// `loadUser` KUTILADI. Chaqiruvchi (login formasi) shundan keyin
			// sahifani almashtiradi — aks holda navigatsiya `/me` so'rovini
			// bekor qiladi va sessiya yarim o'rnatilgan holda qoladi.
			await loadUser();
		},
		[loadUser],
	);

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
