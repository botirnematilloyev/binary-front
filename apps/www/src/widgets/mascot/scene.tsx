"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Box3, Vector3, type Group } from "three";

/*
 * Model AYLANMAYDI, faqat sal-pal tebranadi.
 *
 * Maqsad — hajmni (3D ekanini) bildirish, modelni aylantirib ko'rsatish
 * emas. Ikkala kattaroq variant ham sinab ko'rildi va ikkalasi ham
 * yaramadi: to'xtovsiz 360° aylanishda gopher vaqtining yarmida orqasi
 * bilan turadi, ±90° tebranishda esa qiyalik bilan qo'shilib yana
 * orqasi ko'rinib qolardi. ±26° da u doim odamga qarab turadi, lekin
 * soya va perspektiva o'zgargani uchun tekis rasm emasligi darrov
 * bilinadi.
 */
/** Y bo'yicha eng katta burilish: ±26°. */
const SWING_Y = 0.45;
/** X bo'yicha yengil egilish: ±8°. Undan ortig'i "yiqilyapti" ko'rinadi. */
const TILT_X = 0.14;

/** Tebranish fazasining tinch holatdagi tezligi (rad/s) — to'liq davr ~12 s. */
const IDLE_SPEED = 0.5;
/** Sichqoncha ustida — tezroq, lekin bosh aylantirmaydigan darajada. */
const HOVER_SPEED = 1.3;
/** Bosilganda beriladigan turtki; u ishqalanish bilan so'nadi. */
const CLICK_IMPULSE = 3.5;
const FRICTION = 2.2;

function Digger({
	hovered,
	onHover,
	reduced,
}: {
	hovered: boolean;
	onHover: (value: boolean) => void;
	reduced: boolean;
}) {
	/*
	 * `useLoader` modelni KESHLAYDI va Suspense bilan ishlaydi: model
	 * kelguncha komponent "to'xtab turadi", tashqaridagi fallback esa
	 * joyni band qilib turadi.
	 */
	const gltf = useLoader(GLTFLoader, "/mascot/binary-digger.glb");
	const group = useRef<Group>(null);

	/*
	 * Modelni kadrga o'zi sig'diradi.
	 *
	 * Kamerani qo'lda "shu masofaga qo'yaman" deb sozlash mumkin edi va
	 * birinchi urinishda aynan shunday qilingan — natijada model ekranga
	 * sig'may qoldi. Sabab: glTF'dagi o'lchamlar mesh ichidagi
	 * koordinatalar, ustiga tugunlarning (node) masshtabi qo'shiladi.
	 * Shuning uchun haqiqiy chegara YUKLANGANDAN KEYIN o'lchanadi va
	 * model bir birlikka keltiriladi. Endi boshqa model qo'yilsa ham
	 * kamerani qayta sozlash kerak emas.
	 */
	const fit = useMemo(() => {
		const box = new Box3().setFromObject(gltf.scene);
		const size = box.getSize(new Vector3());
		const center = box.getCenter(new Vector3());
		const scale = 1 / Math.max(size.x, size.y, size.z);

		return {
			scale,
			// Markazni koordinata boshiga surish — aks holda model
			// aylanganda o'z o'qi atrofida emas, chetdan aylanardi.
			offset: center.multiplyScalar(-scale),
		};
	}, [gltf.scene]);

	/*
	 * Tebranish fazasi va sakrash `ref` da, `state` da emas: ular har
	 * kadrda (sekundiga 60 marta) o'zgaradi va `setState` har safar butun
	 * daraxtni qayta render qilardi. React bu yerda umuman ishtirok
	 * etmasligi kerak — faqat three.js sahnasi yangilanadi.
	 */
	const phase = useRef(0);
	const impulse = useRef(0);
	const pop = useRef(0);

	useFrame((state, delta) => {
		const node = group.current;
		if (node === null) return;

		if (reduced) {
			// Harakat so'ralmagan: model bir marta yoqimli burchakka
			// qo'yiladi va shu holda qoladi. Burchak tebranish oralig'idan
			// olingan — statik holat ham xuddi shu ko'rinishning bir kadri
			// bo'lsin.
			node.rotation.y = -SWING_Y;
			return;
		}

		/*
		 * Hamma harakat BITTA fazadan chiqadi va u faqat oldinga yuradi;
		 * burchaklar esa sinusdan olinadi. Shu tufayli tebranish chetga
		 * yetganda "to'xtab-qaytmaydi": tezlik chekkalarda o'zi
		 * nolgacha kamayadi va ortga silliq qaytadi.
		 */
		// Turtki eksponensial so'nadi — to'satdan to'xtash sun'iy ko'rinardi.
		impulse.current *= Math.max(0, 1 - FRICTION * delta);
		phase.current +=
			delta * ((hovered ? HOVER_SPEED : IDLE_SPEED) + impulse.current);
		node.rotation.y = Math.sin(phase.current) * SWING_Y;

		// Yengil nafas olish: yuqoriga-pastga tebranish.
		const t = state.clock.elapsedTime;
		node.position.y = Math.sin(t * 1.2) * 0.03;

		// Bosilganda "sakrash": masshtab tez ko'tarilib, sekin qaytadi.
		pop.current += (0 - pop.current) * Math.min(1, delta * 6);
		const scale = 1 + pop.current;
		node.scale.setScalar(scale);

		/*
		 * X bo'yicha egilish Y dan SEKINROQ tebranadi (0.6 koeffitsiyenti):
		 * ikki o'q bir xil davrda harakatlansa, ular qulflanib qolardi va
		 * natija bitta tekislikdagi mayatnikka o'xshardi. Turli davrlar esa
		 * takrorlanmaydigan, tirik harakat beradi.
		 *
		 * Sichqoncha ustida bo'lganda model unga bir oz "qaraydi".
		 * `state.pointer` — [-1, 1] oralig'idagi normalangan holat,
		 * ya'ni ekran o'lchamiga bog'liq emas.
		 */
		const targetX =
			Math.sin(phase.current * 0.6) * TILT_X +
			(hovered ? state.pointer.y * 0.18 : 0);
		node.rotation.x += (targetX - node.rotation.x) * Math.min(1, delta * 4);
	});

	return (
		<group
			ref={group}
			onPointerOver={(event) => {
				event.stopPropagation();
				onHover(true);
			}}
			onPointerOut={() => onHover(false)}
			onClick={(event) => {
				event.stopPropagation();
				impulse.current = CLICK_IMPULSE;
				pop.current = 0.12;
			}}
		>
			<primitive
				object={gltf.scene}
				scale={fit.scale}
				position={[fit.offset.x, fit.offset.y, fit.offset.z]}
			/>
		</group>
	);
}

export default function MascotScene({
	reduced,
	paused,
}: {
	reduced: boolean;
	/** Ekrandan chiqib ketgan: render halqasi to'xtaydi. */
	paused: boolean;
}) {
	const [hovered, setHovered] = useState(false);

	return (
		/*
		 * Kursor Canvas'ning O'ZIDA emas, o'ramda.
		 *
		 * `style` propini Canvas'ga berish uning standart
		 * `width/height: 100%` qoidalarini bosib ketadi va tuval
		 * brauzerning sukut o'lchamiga (300×150) qaytadi — sahna
		 * kichkina burchakda qolib ketardi.
		 */
		<div
			className="h-full w-full"
			style={{ cursor: hovered ? "pointer" : "default" }}
		>
		<Canvas
			/*
			 * `dpr` yuqoridan cheklangan: Retina ekranda 3x render qilish
			 * piksellar sonini to'qqiz barobar oshiradi va noutbukning
			 * ventilyatorini ishga tushiradi — bu maskot uchun juda
			 * qimmat narx.
			 */
			dpr={[1, 2]}
			/*
			 * Kamera AYNAN `+Z` o'qida turadi va hech qayoqqa burilmaydi.
			 *
			 * Sababi tajribada aniqlandi: kamerani chetga qo'yib
			 * `lookAt` bilan burishga urinilganda sahnada hech narsa
			 * ko'rinmadi — hatto oddiy kub ham. `lookAt` ning qachon
			 * qo'llanishi R3F ichidagi tartibga bog'liq va u ustidan
			 * yozilib ketardi. O'qda turgan kamera esa hech qanday
			 * burilishni talab qilmaydi: standart yo'nalish (`-Z`)
			 * allaqachon markazga qaragan.
			 *
			 * Kerakli burchak MODELNI burish orqali olinadi, kamera esa
			 * umuman qimirlamaydi.
			 *
			 * Masofa 2.0 — o'lchab tanlangan. Model bir birlikka
			 * keltirilgan: eni 0.8, chuqurligi 1.0. Burilish ±26° bilan
			 * cheklangani uchun uning eng keng ko'rinishi
			 * 0.8·cos26° + 1.0·sin26° ≈ 1.16 ni tashkil qiladi. fov 35° da
			 * 2.0 masofada ko'rinadigan kenglik ≈ 1.39, ya'ni chetlarda
			 * ~17% joy qoladi.
			 */
			camera={{ position: [0, 0, 2.0], fov: 35 }}
			/*
			 * `demand` — sahna faqat kerak bo'lganda chiziladi. Harakat
			 * so'ralmaganda ham, ekrandan chiqib ketganda ham halqa
			 * ishlamaydi.
			 */
			frameloop={reduced || paused ? "demand" : "always"}
		>
			{/*
			 * Yorug'lik uchta manbadan: umumiy (ambient), asosiy va
			 * to'ldiruvchi. Bitta yorug'lik bilan modelning yarmi
			 * qop-qora bo'lib qolardi, HDR muhit esa yana bir megabayt
			 * yuklashni talab qilardi.
			 */}
			<ambientLight intensity={0.75} />
			<directionalLight position={[2, 3, 2]} intensity={2.2} />
			<directionalLight position={[-2, 1, -1]} intensity={0.7} />

			<Suspense fallback={null}>
				<Digger hovered={hovered} onHover={setHovered} reduced={reduced} />
			</Suspense>
		</Canvas>
		</div>
	);
}
