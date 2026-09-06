import {
  IconAlertCircle,
  IconLeaf,
  IconMapPin,
  IconRefresh,
  IconShieldCheck,
  IconX,
} from "@tabler/icons-react";
import type { PestType } from "../../types/demoStore";

type Lang = "hil" | "en";

const PLANS: Record<
  PestType,
  Record<
    Lang,
    {
      eyebrow: string;
      title: string;
      subtitle: string;
      alert: string;
      reminder: string;
      sections: { title: string; body: string; bullets?: string[] }[];
    }
  >
> = {
  healthy: {
    hil: {
      eyebrow: "MGA PAAGI SA PAGMANTINAR",
      title: "Kompletong Preventive Care Plan",
      subtitle: "Maayo nga kondisyon sang lubi",
      alert: "Ang resulta nagapakita nga maayo ang kondisyon sang puno. Padayonon ang regular nga pag-atiman para malikawan ang peste kag sakit.",
      reminder: "Hinumdum: Ang maayo nga sanitation kag regular monitoring amo ang una nga depensa sang uma.",
      sections: [
        { title: "1. Pagbantay sa Puno", body: "Tan-awa ang bag-o nga dahon, spear leaf, kag ilalom sang dahon kada semana para makita dayon kung may pagbag-o." },
        { title: "2. Nutrisyon kag Tubig", body: "Ipadayon ang husto nga schedule sang abono kag siguruhon nga indi naga-ipon ang tubig sa palibot sang gamot." },
        { title: "3. Sanitation", body: "Limpyohi ang palibot sang puno kag kuhaa ang nagakadunot nga materyales nga mahimo puluy-an sang peste." },
        { title: "4. Sunod nga Aksyon", body: "Kung may makita nga pagdilaw, tuldok, ukon damage sa bag-o nga dahon, kuhaan sang klaro nga litrato kag ipadala liwat sa sistema." },
      ],
    },
    en: {
      eyebrow: "PREVENTIVE MANAGEMENT",
      title: "Complete Preventive Care Plan",
      subtitle: "Healthy coconut palm condition",
      alert: "The result shows that the palm is currently healthy. Continue regular care to prevent pests and disease.",
      reminder: "Reminder: Good sanitation and regular monitoring are the farm’s first line of defense.",
      sections: [
        { title: "1. Tree Monitoring", body: "Check new fronds, spear leaves, and leaf undersides weekly so early changes are noticed quickly." },
        { title: "2. Nutrition and Water", body: "Maintain the fertilizer schedule and make sure water does not stay pooled around the roots." },
        { title: "3. Sanitation", body: "Clean the base of the palm and remove decaying materials that may shelter pests." },
        { title: "4. Next Action", body: "If yellowing, spots, or new-frond damage appears, take a clear photo and submit another analysis." },
      ],
    },
  },
  yellowing: {
    hil: {
      eyebrow: "MGA PAAGI SA PAGDUMALA",
      title: "Kompletong Management Plan",
      subtitle: "Pagdilaw sang dahon sang lubi",
      alert: "Ang pagdilaw mahimo halin sa kulang nutrisyon, problema sa tubig, ukon pagsugod sang sakit. Kinahanglan tan-awon ang kondisyon sang duta kag palibot.",
      reminder: "Hinumdum: Indi dayon magsobra sang abono kung wala pa makumpirma ang rason sang pagdilaw.",
      sections: [
        { title: "1. Suriha ang Duta", body: "Tan-awa kung uga gid ukon sobra ka basa ang duta. Kung posible, magpa-soil test para mahibaluan ang kakulangan sa nutrisyon." },
        { title: "2. Tubig kag Drainage", body: "Siguruhon nga may maayo nga pag-agas sang tubig kag wala naga-ipon sa palibot sang puno." },
        { title: "3. Pag-monitor", body: "Markahi ang apektado nga puno kag obserbahi kung nagadamo ang nagadilaw nga dahon." },
        { title: "4. I-report", body: "Kung nagalapta ang pagdilaw sa madamo nga puno, ipadala sa PCA para ma-schedule ang field validation." },
      ],
    },
    en: {
      eyebrow: "MANAGEMENT OPTIONS",
      title: "Complete Management Plan",
      subtitle: "Coconut leaf yellowing",
      alert: "Yellowing may come from nutrient deficiency, water stress, or early disease. The soil and surrounding conditions should be checked.",
      reminder: "Reminder: Avoid over-fertilizing until the cause of yellowing is confirmed.",
      sections: [
        { title: "1. Check the Soil", body: "Look for very dry or overly wet soil. If possible, request a soil test to identify nutrient deficiencies." },
        { title: "2. Water and Drainage", body: "Make sure water flows properly and does not collect around the palm base." },
        { title: "3. Monitoring", body: "Mark affected palms and watch whether yellowing spreads to more leaves or more trees." },
        { title: "4. Report", body: "If yellowing spreads across multiple palms, submit the case to PCA for field validation." },
      ],
    },
  },
  "scale insect": {
    hil: {
      eyebrow: "MGA PAAGI SA PAGDUMALA",
      title: "Kompletong Management Plan",
      subtitle: "Coconut Scale Insect ukon Cocolisap",
      alert: "Ang cocolisap dali maglapta sa iban nga puno kung indi dayon mabantayan kag matapna.",
      reminder: "Hinumdum: I-coordinate sa PCA antes mag-spray para husto ang treatment kag dosage.",
      sections: [
        { title: "1. Deskripsyon sa Peste", body: "Ang scale insect nagapilit sa dahon kag nagasuyop sang sustansya, nga nagresulta sa pagdilaw kag paghuyang sang puno." },
        { title: "2. Pagkalat", body: "Mahimo ini maglapta paagi sa hangin, gamit sa uma, ukon pagdala sang apektado nga dahon sa iban nga parte sang uma." },
        { title: "3. Pagkontrol", body: "Kuhaa ang grabe nga apektado nga dahon kag ipalayo sa himsog nga puno.", bullets: ["Likawan ang pagbalhin sang apektado nga materyales.", "Tan-awa ang likod sang dahon kada semana.", "Mag-coordinate sa PCA para sa approved treatment."] },
        { title: "4. Follow-up", body: "Magkuha liwat sang litrato pagkatapos sang treatment para makita kung nag-nubo ang infestation." },
      ],
    },
    en: {
      eyebrow: "MANAGEMENT OPTIONS",
      title: "Complete Management Plan",
      subtitle: "Coconut Scale Insect",
      alert: "Coconut scale insect can spread quickly to nearby palms if not monitored and controlled early.",
      reminder: "Reminder: Coordinate with PCA before spraying so the treatment and dosage are correct.",
      sections: [
        { title: "1. Pest Description", body: "Scale insects attach to leaves and suck plant nutrients, causing yellowing and weakening of the palm." },
        { title: "2. Spread", body: "It may spread through wind, farm tools, or moving affected fronds to other areas of the farm." },
        { title: "3. Control", body: "Remove severely affected fronds and keep them away from healthy palms.", bullets: ["Avoid transferring affected materials.", "Inspect leaf undersides weekly.", "Coordinate with PCA for approved treatment."] },
        { title: "4. Follow-up", body: "Take another photo after treatment to check whether infestation has decreased." },
      ],
    },
  },
  "rhino beetle": {
    hil: {
      eyebrow: "MGA PAAGI SA PAGDUMALA",
      title: "Kompletong Management Plan",
      subtitle: "Rhinoceros Beetle (Oryctes rhinoceros)",
      alert: "Ang rhinoceros beetle amo ang isa sa pinaka importante nga peste sang lubi nga naga dulot sang grabe nga kadaot, labi na sa mga batang puno.",
      reminder: "Hinumdum: Ang integrated pest management amo ang pinaka epektibo nga paagi sa pagkontrol sang rhinoceros beetle.",
      sections: [
        { title: "1. Deskripsyon sa Peste", body: "Ang rhinoceros beetle amo ang dako nga salagubang nga may sungay sa unahan sang ulo. Ginakagat sini ang bag-o nga dahon kag spear leaf." },
        { title: "2. Kadaot", body: "Ang damage makita bilang V-shaped cuts sa bag-o nga dahon. Kung grabe, mahimo maghinay ang pagtubo kag mapatay ang bata nga puno." },
        { title: "3. Life Stages", body: "Itlog: 12 ka adlaw. Larva: 80-130 ka adlaw. Pupa: 20 ka adlaw. Adulto: 120 ka adlaw." },
        { title: "4. Oportunidad sang Pagkalat", body: "Nagapadamo ini sa nagakadunot nga organiko nga materyales.", bullets: ["Pundok sang abono, compost, ukon manure.", "Nabakal nga tuod kag kahoy nga ginapundok.", "Nagakadunot nga materyales sa uma."] },
        { title: "5. Pagkontrol", body: "Gamita ang kombinasyon sang sanitation, traps, kag PCA guidance.", bullets: ["Kuhaa ang breeding sites.", "Gamita ang light traps ukon pheromone traps kung available.", "I-report dayon kung madamo ang apektado nga puno."] },
      ],
    },
    en: {
      eyebrow: "MANAGEMENT STRATEGIES",
      title: "Complete Management Plan",
      subtitle: "Rhinoceros Beetle (Oryctes rhinoceros)",
      alert: "Rhinoceros beetle is one of the most important coconut pests and can cause severe damage, especially to young palms.",
      reminder: "Reminder: Integrated pest management is the most effective approach for rhinoceros beetle control.",
      sections: [
        { title: "1. Pest Description", body: "The rhinoceros beetle is a large beetle with a horn-like structure. It damages young fronds and the spear leaf." },
        { title: "2. Damage", body: "Damage often appears as V-shaped cuts on new fronds. Severe attacks can slow growth and may kill young palms." },
        { title: "3. Life Stages", body: "Egg: 12 days. Larva: 80-130 days. Pupa: 20 days. Adult: 120 days." },
        { title: "4. Spread Opportunities", body: "The pest breeds in decaying organic matter.", bullets: ["Compost, manure, or coir dust piles.", "Stacked decaying trunks or wood.", "Rotting organic materials around the farm."] },
        { title: "5. Control", body: "Use a combination of sanitation, traps, and PCA guidance.", bullets: ["Remove breeding sites.", "Use light traps or pheromone traps when available.", "Report immediately if several palms are affected."] },
      ],
    },
  },
};

const ICONS = [IconLeaf, IconAlertCircle, IconRefresh, IconMapPin, IconShieldCheck];

export default function RecommendationPlanModal({
  open,
  pest,
  lang,
  onClose,
}: {
  open: boolean;
  pest: PestType;
  lang: Lang;
  onClose: () => void;
}) {
  if (!open) return null;
  const plan = PLANS[pest][lang];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-pca-text shadow-lg hover:bg-pca-bg"
        aria-label="Close recommendations"
      >
        <IconX size={24} />
      </button>
      <div className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl md:p-8">
        <div className="mb-4 text-xs font-black uppercase tracking-widest text-pca-muted">{plan.eyebrow}</div>
        <h2 className="text-2xl font-black leading-tight text-pca-text md:text-3xl">{plan.title}</h2>
        <p className="mt-1 text-base font-black text-pca-red">{plan.subtitle}</p>
        <div className="mt-5 flex gap-4 rounded-xl bg-pca-red-light p-4 text-sm font-semibold leading-relaxed text-pca-text">
          <IconAlertCircle className="mt-0.5 shrink-0 text-pca-red" size={22} />
          <p>{plan.alert}</p>
        </div>
        <div className="mt-6 space-y-5">
          {plan.sections.map((section, index) => {
            const Icon = ICONS[index % ICONS.length] ?? IconLeaf;
            return (
              <section key={section.title} className="grid gap-4 border-b border-pca-border pb-5 last:border-0 md:grid-cols-[72px_1fr]">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-pca-green-light text-pca-green">
                  <Icon size={26} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-pca-green">{section.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-pca-text">{section.body}</p>
                  {section.bullets?.length ? (
                    <ul className="mt-3 space-y-1.5 text-sm font-medium leading-relaxed text-pca-text">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pca-text" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
        <div className="mt-6 rounded-xl bg-pca-green-light p-4 text-sm leading-relaxed text-pca-text">
          <strong className="text-pca-green">{lang === "hil" ? "Hinumdum:" : "Reminder:"}</strong>{" "}
          {plan.reminder.replace(/^Hinumdum:\s*|^Reminder:\s*/i, "")}
        </div>
      </div>
    </div>
  );
}
