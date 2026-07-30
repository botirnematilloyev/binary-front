import Link from "next/link";
import { buttonClass, Container } from "@binary/ui";

export default function NotFound() {
	return (
		<Container className="py-24 text-center">
			<p className="font-mono text-sm text-fg-subtle">404</p>
			<h1 className="mt-2 text-[28px] font-bold">Sahifa topilmadi</h1>
			<p className="mx-auto mt-2 max-w-[420px] text-fg-muted">
				Manzil o'zgargan bo'lishi mumkin, yoki masala hali nashr qilinmagan.
			</p>
			<div className="mt-6">
				<Link href="/masalalar" className={buttonClass({ variant: "outline" })}>
					Masalalarga qaytish
				</Link>
			</div>
		</Container>
	);
}
