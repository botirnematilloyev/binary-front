import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Sahifa keni shablonda hamma joyda bir xil (1080px) — nav, main, footer.
 * Shuning uchun u komponent, har sahifada takrorlanadigan sinf ro'yxati emas.
 */
export function Container({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("mx-auto w-full max-w-content px-6", className)}>{children}</div>
	);
}

/**
 * Chegarali oq panel — ro'yxatlar, kartalar va yon paneller uchun asos.
 *
 * `children` ixtiyoriy: yuklanish skeleti bo'sh panel bo'ladi va u
 * qonuniy holat. Majburiy qilinsa chaqiruvchi `<Panel>{null}</Panel>`
 * yozishga majbur bo'lardi — bu qoidani kuchaytirmaydi, faqat shovqin
 * qo'shadi.
 */
export function Panel({
	children,
	className,
}: {
	children?: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"rounded-card border border-border-default bg-surface overflow-hidden",
				className,
			)}
		>
			{children}
		</div>
	);
}
