import { BinaryLoader } from "@/widgets/binary-loader";

/**
 * Sahifalar orasidagi kutish ekrani.
 *
 * Next buni Suspense fallback sifatida O'ZI ishlatadi: `[locale]`
 * ostidagi biror sahifaga o'tilganda, server komponenti tayyor
 * bo'lguncha shu ko'rsatiladi. Qo'lda hech narsa ulash kerak emas —
 * shu sababli u navigatsiya boshlanishini "sezish" uchun router
 * hodisalariga obuna bo'lgan client komponentdan afzal.
 *
 * Sarlavha (`layout`) o'z joyida qoladi va faqat kontent almashadi:
 * butun ekranni qoplaydigan overlay sahifadan sahifaga o'tishni
 * og'irroq ko'rsatardi.
 */
export default function Loading() {
	return <BinaryLoader />;
}
