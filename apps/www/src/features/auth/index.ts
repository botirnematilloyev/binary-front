export { SessionProvider, useSession, type SessionStatus } from "./session-provider";
export { LoginForm } from "./ui/login-form";

/**
 * `token-store` ATAYLAB eksport qilinmaydi.
 *
 * Unga faqat `SessionProvider` murojaat qiladi. Ochiq qoldirilsa, biror
 * komponent `getAccessToken()` ni to'g'ridan-to'g'ri chaqirib, React
 * holatidan tashqarida ishlay boshlardi — natijada sessiya tugaganda UI
 * yangilanmasdan qolardi. Token kerak bo'lsa `useSession().getToken()`.
 */
