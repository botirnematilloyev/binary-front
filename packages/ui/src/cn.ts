import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Sinf nomlarini birlashtiradi va Tailwind'ning ziddiyatlarini hal qiladi.
 *
 * `twMerge` shart, oddiy shablon satri emas: `cn("p-2", props.className)`
 * da chaqiruvchi `p-6` bersa, CSS'da g'olib **fayldagi tartib** bo'yicha
 * aniqlanadi, propdagi tartib bo'yicha emas — ya'ni ba'zan chaqiruvchi
 * yenga olmaydi. `twMerge` oldingi qarama-qarshi utility'ni olib tashlaydi.
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
