import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { problemsApi, taxonomyApi } from "@binary/api";
import { Container, Panel } from "@binary/ui";
import { pickName } from "@/features/problem-catalog";
import { Link } from "@/i18n/navigation";
import { HomeHero } from "@/widgets/home-hero";
import { buildAlternates } from "@/shared/i18n/alternates";
import { apiLangOf, type Locale } from "@/shared/i18n/locales";

/**
 * Bosh sahifa soatiga bir marta yangilanadi.
 *
 * Undagi raqamlar (masalalar soni, fanlar) sekin o'zgaradi — setter
 * kuniga bir necha masala qo'shadi. Katalogdagi 5 daqiqadan uzunroq,
 * chunki bu yerda aniqlik emas, "kattalik tartibi" muhim.
 */
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return {
    title: t("metaTitle"),
    description: t("subtitle"),
    alternates: buildAlternates({ pathname: "/" }, { canonicalLocale: locale }),
  };
}

/** Fan belgisi — maketdagi kabi. Noma'lum fan uchun neytral `#`. */
const SUBJECT_ICON: Record<string, string> = {
  algorithm: "{ }",
  math: "∑",
  informatics: "⊕",
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const apiLang = apiLangOf(locale);

  const [all, subjects, languages] = await Promise.all([
    // `per_page=1` — bizga faqat `total` kerak, ro'yxatning o'zi emas.
    problemsApi.listProblems({ perPage: 1, lang: apiLang }, { revalidate }),
    taxonomyApi.listSubjects({ revalidate }),
    problemsApi.listProblems({ perPage: 1 }, { revalidate }),
  ]);
  void languages;

  /*
   * Har fan uchun alohida son. Uni bitta so'rovda olish uchun backendda
   * "fanlar bo'yicha guruhlangan sanoq" kerak bo'lardi; fanlar soni esa
   * uch-to'rtta va javoblar bir soat keshlanadi, ya'ni bu yerda
   * parallel so'rovlar arzonroq yechim.
   */
  const counts = await Promise.all(
    subjects.subjects.map((subject) =>
      problemsApi
        .listProblems(
          { subjectId: subject.id, perPage: 1, lang: apiLang },
          { revalidate },
        )
        .then((result) => result.total)
        .catch(() => 0),
    ),
  );

  /*
   * Masalasi YO'Q fan bosh sahifada ko'rsatilmaydi.
   *
   * Katalogda u qoladi (u yerda ro'yxat to'liq bo'lishi kerak), lekin
   * bosh sahifa — vitrina: "0 ta masala" deb turgan kartochka bosilsa,
   * bo'sh ro'yxat ochiladi va birinchi taassurot shu bo'ladi.
   */
  const shown = subjects.subjects
    .map((subject, index) => ({ subject, count: counts[index] ?? 0 }))
    .filter((item) => item.count > 0);

  const stats = [
    { value: String(all.total), label: t("statProblems") },
    { value: String(subjects.subjects.length), label: t("statSubjects") },
    { value: "3", label: t("statLanguages") },
    { value: t("statFreeValue"), label: t("statFree") },
  ];

  return (
    <Container className="py-16">
      <HomeHero stats={stats} />

      {/* ── Fanlar ── */}
      {shown.length > 0 && (
        <section className="mt-20">
          <h2 className="text-[22px] font-bold">{t("subjectsTitle")}</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map(({ subject, count }) => (
              /*
               * Butun kartochka havola: ichida bitta "→" havolasi
               * bo'lsa, bosish maydoni kichkina bo'lardi va
               * foydalanuvchi kartochkani bosib, hech narsa
               * bo'lmaganini ko'rardi.
               */
              <Link
                key={subject.id}
                href={{
                  pathname: "/masalalar",
                  query: { subject_id: subject.id },
                }}
                className="group rounded-card border border-border-default bg-surface p-5 transition-colors hover:border-accent"
              >
                <span
                  aria-hidden
                  className="font-mono text-[20px] text-fg-subtle"
                >
                  {SUBJECT_ICON[subject.slug] ?? "#"}
                </span>
                <h3 className="mt-3 font-display text-[17px] font-semibold">
                  {pickName(subject.name, apiLang)}
                </h3>
                <p className="mt-3 font-mono text-[13px] text-fg-muted group-hover:text-accent">
                  {t("subjectCount", { count })} →
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Qanday ishlaydi ── */}
      <section className="mt-20">
        <h2 className="text-[22px] font-bold">{t("howTitle")}</h2>

        {/*
         * Bu bo'lim ma'lumotga TAYANMAYDI va shuning uchun har doim
         * to'g'ri: u mahsulotning o'zi qanday ishlashini aytadi.
         * Aynan shuning uchun u bosh sahifada birinchi kunidan
         * turishi mumkin, statistika esa ma'lumot bilan birga
         * o'sadi.
         */}
        <ol className="mt-5 grid gap-6 sm:grid-cols-3">
          {[1, 2, 3].map((step) => (
            <li key={step}>
              <span className="font-mono text-[13px] font-bold text-accent">
                {String(step).padStart(2, "0")}
              </span>
              <h3 className="mt-2 font-display text-[17px] font-semibold">
                {t(`step${step}Title`)}
              </h3>
              <p className="mt-1.5 text-fg-secondary">{t(`step${step}Text`)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Nima ustida ishlanyapti ── */}
      <section className="mt-20">
        <Panel className="flex flex-wrap items-center gap-x-6 gap-y-3 p-6">
          <div className="min-w-0">
            <h2 className="font-display text-[17px] font-semibold">
              {t("roadmapTitle")}
            </h2>
            {/*
             * "Tez kunda" degan va'da emas, ustida ishlanayotgan
             * ro'yxat: sana aytilmaydi, chunki uni bajarishga
             * majburiyat yo'q.
             */}
            <p className="mt-1.5 text-fg-secondary">{t("roadmapText")}</p>
          </div>
          <Link
            href="/masalalar"
            className="ml-auto font-semibold text-accent hover:text-accent-hover"
          >
            {t("roadmapCta")} →
          </Link>
        </Panel>
      </section>
    </Container>
  );
}
