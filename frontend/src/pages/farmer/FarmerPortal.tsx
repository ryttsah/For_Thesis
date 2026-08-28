import {
  IconAlertCircle,
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconBell,
  IconCamera,
  IconChartBar,
  IconCheck,
  IconCircleCheck,
  IconHistory,
  IconLeaf,
  IconLogout,
  IconSend,
  IconThumbDown,
  IconThumbUp,
} from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RECOMMENDATIONS } from "../../constants/demoData";
import { FARMER_I18N } from "../../constants/farmerI18n";
import { useAuth } from "../../context/AuthContext";
import { useDemoStore } from "../../context/DemoStoreContext";
import { hasAuthToken, isApiEnabled } from "../../services/api";
import { fetchFarmerSectorStatus, fetchProvincialStats, type FarmerSectorRow, type ProvincialStats } from "../../services/analytics";
import { createFarmerSubmissionApi, fetchFarmerBootstrap } from "../../services/domain";
import {
  CLASS_DISPLAY,
  CLASS_ORDER,
  getTopClassFromPredictions,
  predictLeafImages,
  summarizeFromPerImage,
  type AggregatedPredictResult,
  type PerImagePredictResult,
} from "../../services/predict";
import type { FarmerSubmission, PestType } from "../../types/demoStore";

type Lang = "hil" | "en";

const PESTS: PestType[] = ["healthy", "yellowing", "scale insect", "rhino beetle"];

const SECTOR_ICONS = { A: IconArrowUp, B: IconArrowDown, C: IconArrowRight, D: IconArrowLeft };

function LoadingRing({ size = "h-16 w-16" }: { size?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`${size} mx-auto block rounded-full border-4 border-pca-green/20 border-t-pca-green animate-spin`}
    />
  );
}

export default function FarmerPortal() {
  const { logout, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const { farmerNotifications, farmerSubmissions, addFarmerSubmission, syncFarmerDomain } = useDemoStore();

  useEffect(() => {
    if (!isApiEnabled() || isAuthLoading || !hasAuthToken()) return;
    void fetchFarmerBootstrap().then((data) => {
      if (data) syncFarmerDomain(data);
    });
  }, [syncFarmerDomain, isAuthLoading]);
  const [lang, setLang] = useState<Lang>("hil");
  const [step, setStep] = useState(1);
  const [sector, setSector] = useState("C");
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [preparingUploads, setPreparingUploads] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [confidencePct, setConfidencePct] = useState<number | null>(null);
  const [photoCounts, setPhotoCounts] = useState<Record<string, number> | null>(null);
  const [photoSharePct, setPhotoSharePct] = useState<Record<string, number> | null>(null);
  const [majorityClass, setMajorityClass] = useState<(typeof CLASS_ORDER)[number] | null>(null);
  const [perImageResults, setPerImageResults] = useState<PerImagePredictResult[]>([]);
  const [photosAnalyzed, setPhotosAnalyzed] = useState(0);
  const [isUncertain, setIsUncertain] = useState(false);
  const [detectedPest, setDetectedPest] = useState<PestType>("healthy");
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [provincialStats, setProvincialStats] = useState<ProvincialStats | null>(null);
  const [sectorRows, setSectorRows] = useState<FarmerSectorRow[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!isApiEnabled() || isAuthLoading || !hasAuthToken()) return;
    void fetchProvincialStats().then(setProvincialStats);
    void fetchFarmerSectorStatus().then((rows) => {
      if (rows) setSectorRows(rows);
    });
  }, [isAuthLoading, farmerSubmissions.length]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
    };
  }, []);

  function resetUploadSession() {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = [];
    setPreviews([]);
    setUploadedFiles([]);
    setPreparingUploads(false);
    setAnalyzeError(null);
    setConfidencePct(null);
    setPhotoCounts(null);
    setPhotoSharePct(null);
    setMajorityClass(null);
    setPerImageResults([]);
    setPhotosAnalyzed(0);
    setIsUncertain(false);
    setDetectedPest("healthy");
    setFeedback(null);
    setFeedbackMsg("");
    setAnalyzing(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function applyAggregatedResult(aggregated: AggregatedPredictResult) {
    setDetectedPest(aggregated.pest);
    setConfidencePct(aggregated.confidence);
    setPhotoCounts(aggregated.photoCounts);
    setPhotoSharePct(aggregated.photoSharePct);
    setMajorityClass(aggregated.majorityClass);
    setPerImageResults(aggregated.perImage);
    setPhotosAnalyzed(aggregated.perImage.length);
    setIsUncertain(aggregated.uncertain);
    setAnalyzeError(aggregated.uncertain && aggregated.message ? aggregated.message : null);
  }

  const newCount = farmerNotifications.filter((n) => n.isNew).length;
  const rec = RECOMMENDATIONS[detectedPest][lang];
  const cardClass =
    detectedPest === "healthy" ? "healthy" : detectedPest === "yellowing" ? "warning" : "danger";

  const runAnalyze = useCallback(
    async (batch: { file: File; previewUrl: string }[]) => {
      setAnalyzing(true);
      setAnalyzeError(null);
      setConfidencePct(null);
      setPhotoCounts(null);
      setPhotoSharePct(null);
      setMajorityClass(null);
      setPerImageResults([]);
      setPhotosAnalyzed(0);
      setIsUncertain(false);

      if (!batch.length) {
        setAnalyzing(false);
        return;
      }

      if (isApiEnabled()) {
        if (!hasAuthToken()) {
          setAnalyzeError(
            lang === "hil"
              ? "Kinahanglan mag-sign in sa live server (indi demo offline) aron magamit ang CNN."
              : "Sign in while the backend is running — offline demo login cannot run CNN analysis.",
          );
          setAnalyzing(false);
          return;
        }

        const apiResult = await predictLeafImages(batch);
        if (apiResult.success) {
          applyAggregatedResult(apiResult.aggregated);
          setAnalyzing(false);
          setStep(3);
          return;
        }

        setAnalyzeError(apiResult.message);
        setAnalyzing(false);
        return;
      }

      // Demo-only when VITE_API_URL is unset
      const demoPerImage: PerImagePredictResult[] = batch.map((item, index) => {
        const pest = PESTS[Math.floor(Math.random() * PESTS.length)]!;
        const scores: Record<string, number> = {
          Healthy: pest === "healthy" ? 99 : 5,
          Yellowing: pest === "yellowing" ? 99 : 5,
          Coconut_Scale_Insect: pest === "scale insect" ? 99 : 5,
          Rhinoceros_Beetle: pest === "rhino beetle" ? 99 : 5,
        };
        const topClass = getTopClassFromPredictions(scores);
        return {
          index,
          fileName: item.file.name,
          previewUrl: item.previewUrl,
          result: {
            pest,
            label: pest,
            confidence: scores[topClass] ?? 99,
            uncertain: false,
            predictions: scores,
            thresholdedLabels: [],
            topGuesses: [],
          },
        };
      });
      applyAggregatedResult(summarizeFromPerImage(demoPerImage));
      setTimeout(() => {
        setAnalyzing(false);
        setStep(3);
      }, 1200);
    },
    [lang],
  );

  function startAnalyze() {
    const batch = uploadedFiles
      .map((file, index) => ({
        file,
        previewUrl: previews[index] ?? "",
      }))
      .filter((item) => item.previewUrl);

    if (batch.length !== uploadedFiles.length) {
      setAnalyzeError(
        lang === "hil"
          ? "Paabuta nga matapos ang pag-upload sang tanan nga litrato."
          : "Wait until all photos finish loading before analyzing.",
      );
      return;
    }

    setStep(2);
    void runAnalyze(batch);
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? []);
    if (!incoming.length) return;
    const remaining = 10 - previews.length;
    const allowed = incoming.slice(0, remaining);
    if (!allowed.length) {
      e.target.value = "";
      return;
    }

    setPreparingUploads(true);
    setAnalyzeError(null);

    const nextPreviews = allowed.map((file) => URL.createObjectURL(file));
    previewUrlsRef.current.push(...nextPreviews);
    setPreviews((prev) => [...prev, ...nextPreviews].slice(0, 10));
    setUploadedFiles((prev) => [...prev, ...allowed].slice(0, 10));
    setPreparingUploads(false);

    e.target.value = "";
  }

  function removePreview(idx: number) {
    const url = previews[idx];
    if (url) {
      URL.revokeObjectURL(url);
      previewUrlsRef.current = previewUrlsRef.current.filter((item) => item !== url);
    }
    setPreviews((p) => p.filter((_, i) => i !== idx));
    setUploadedFiles((p) => p.filter((_, i) => i !== idx));
  }

  function confirmResult(correct: boolean) {
    setFeedback(correct ? "yes" : "no");
    setFeedbackMsg(
      correct
        ? lang === "hil"
          ? "Salamat! Gintalaan ang imo feedback."
          : "Thanks! Your feedback was recorded."
        : lang === "hil"
          ? "Salamat. I-report ini sa imo opisyal para sa follow-up."
          : "Thanks. This will be flagged for officer follow-up.",
    );
  }

  async function submitResult() {
    const submission: FarmerSubmission = {
      date:
        new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) +
        ` - ${rec.title}`,
      sector,
      tag: rec.title,
      tagClass: detectedPest === "healthy" ? "green" : detectedPest === "yellowing" ? "orange" : "red",
      color: detectedPest === "healthy" ? "#22a355" : detectedPest === "yellowing" ? "#f59e0b" : "#dc2626",
    };

    if (isApiEnabled()) {
      const ok = await createFarmerSubmissionApi(submission, {
        confidencePct: confidencePct ?? 0,
        uncertain: isUncertain,
        imageCount: photosAnalyzed || previews.length || 1,
      });
      if (ok) {
        const data = await fetchFarmerBootstrap();
        if (data) syncFarmerDomain(data);
        void fetchFarmerSectorStatus().then((rows) => {
          if (rows) setSectorRows(rows);
        });
        void fetchProvincialStats().then(setProvincialStats);
      } else {
        addFarmerSubmission(submission);
      }
    } else {
      addFarmerSubmission(submission);
    }

    alert(
      lang === "hil"
        ? "Naipadala na ang resulta sa PCA! Maghulat sang feedback gikan sa imo opisyal."
        : "Result submitted to PCA! Wait for feedback from your officer.",
    );
    resetUploadSession();
    setStep(1);
  }

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  const t = {
    portal: FARMER_I18N.portal[lang],
    logout: FARMER_I18N.logout[lang],
    welcome: FARMER_I18N.welcome[lang],
    step1: FARMER_I18N.step1[lang],
    step2: FARMER_I18N.step2[lang],
    step3: FARMER_I18N.step3[lang],
    sectors: {
      A: FARMER_I18N.sectors.A[lang],
      B: FARMER_I18N.sectors.B[lang],
      C: FARMER_I18N.sectors.C[lang],
      D: FARMER_I18N.sectors.D[lang],
    },
  };

  return (
    <div className="min-h-screen bg-pca-bg">
      <div className="mx-auto max-w-[560px] px-4 py-6 md:max-w-[1000px] lg:px-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-pca-border">
              <IconLeaf size={24} className="text-pca-green" />
            </div>
            <div>
              <div className="text-[17px] font-bold tracking-tight">PCA Negros Occidental</div>
              <div className="text-xs font-medium text-pca-muted">{t.portal}</div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="flex overflow-hidden rounded-xl border border-pca-border bg-white p-1 shadow-sm">
              {(["hil", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  aria-label={l === "hil" ? "Use Hiligaynon" : "Use English"}
                  className={`min-w-10 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all sm:px-3 ${
                    lang === l ? "bg-pca-green text-white shadow-sm" : "text-pca-muted hover:text-pca-text"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-pca-border bg-white px-4 py-2 text-[13px] font-bold text-pca-muted shadow-sm transition-all hover:bg-pca-bg hover:text-pca-text"
            >
              <IconLogout size={16} />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          </div>
        </header>

        {/* Top Info Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="f-card !mb-0 flex flex-col justify-center">
            <h2 className="text-xl font-bold">{t.welcome}</h2>
            <div className="mt-4 rounded-xl border border-pca-green-soft bg-pca-green-light px-4 py-3.5 text-[14px] text-pca-green">
              <span className="font-bold">{lang === "hil" ? "Imo Umahan:" : "Your Farm:"}</span> Juan Espinosa — Sector C, Brgy. Conception
            </div>
          </div>

          <div className="f-card !mb-0">
            <h3 className="mb-3 flex items-center gap-2 text-[15px] font-bold">
              <IconBell size={18} className="text-orange-600" />
              {FARMER_I18N.notifications[lang]}
              <span className="rounded-full bg-pca-red-light px-2 py-0.5 text-[11px] font-bold text-pca-red">
                {newCount} new
              </span>
            </h3>
            <div className="space-y-2">
              {farmerNotifications.slice(0, 2).map((n) => (
                <div key={n.id} className="flex items-center gap-3 rounded-xl border border-pca-bg bg-pca-bg/50 p-3">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: n.dot }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold">{n.dateLine}</div>
                    <div className="truncate text-[11px] text-pca-muted">{n.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Provincial Stats (Wide) */}
        <div className="f-card mb-8">
          <div className="md:flex md:items-end md:justify-between md:gap-8">
            <div className="mb-4 md:mb-0 md:max-w-md">
              <h3 className="mb-2 flex items-center gap-2 text-base font-bold">
                <IconChartBar size={18} className="text-blue-600" />
                {FARMER_I18N.provincialStats[lang]}
              </h3>
              <p className="text-[13px] leading-relaxed text-pca-muted">
                {FARMER_I18N.provincialLead[lang]}
              </p>
            </div>
            {provincialStats && provincialStats.sample_size > 0 ? (
              <div className="grid flex-1 grid-cols-3 gap-3">
                <div className="rounded-xl border border-pca-border bg-pca-bg p-3 text-center">
                  <div className="text-lg font-black text-pca-green">{provincialStats.healthy_pct}%</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-pca-muted">Healthy</div>
                </div>
                <div className="rounded-xl border border-pca-border bg-pca-bg p-3 text-center">
                  <div className="text-lg font-black text-orange-600">{provincialStats.yellowing_pct}%</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-pca-muted">Warning</div>
                </div>
                <div className="rounded-xl border border-pca-border bg-pca-bg p-3 text-center">
                  <div className="text-lg font-black text-pca-red">{provincialStats.pest_pct}%</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-pca-muted">Pest</div>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-pca-muted">No data yet.</p>
            )}
          </div>
        </div>

        {/* Flow Stepper */}
        <div className="mx-auto mb-10 max-w-xl flex">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`relative flex flex-1 flex-col items-center ${n < 3 ? "after:absolute after:left-1/2 after:top-4 after:z-0 after:h-0.5 after:w-full after:bg-pca-border" : ""} ${step > n ? "after:!bg-pca-green" : ""}`}>
              <div className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-bold transition-all ${step >= n ? "bg-pca-green text-white shadow-lg shadow-pca-green/20" : "bg-white border-2 border-pca-border text-pca-muted"}`}>{n}</div>
              <span className={`mt-2 text-[11px] font-bold uppercase tracking-wider ${step >= n ? "text-pca-green" : "text-pca-muted"}`}>{n === 1 ? t.step1 : n === 2 ? t.step2 : t.step3}</span>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="animate-fade-in grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="f-card !mb-0">
              <h2 className="text-xl font-bold mb-4">{FARMER_I18N.selectSector[lang]}</h2>
              <div className="grid grid-cols-2 gap-3">
                {(["A", "B", "C", "D"] as const).map((code) => {
                  const Icon = SECTOR_ICONS[code];
                  return (
                    <button key={code} type="button" onClick={() => setSector(code)} className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${sector === code ? "border-pca-green bg-pca-green-light shadow-sm" : "border-pca-border hover:bg-pca-bg"}`}>
                      <Icon size={24} className="text-pca-green" />
                      <span className="text-[14px] font-bold">Sector {code}</span>
                      <small className="text-[11px] font-medium text-pca-muted">{t.sectors[code]}</small>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="f-card !mb-0">
              <h2 className="text-xl font-bold mb-4">{lang === "hil" ? "I-upload ang Litrato" : "Upload Photos"}</h2>
              <button type="button" disabled={preparingUploads} onClick={() => fileRef.current?.click()} className={`mb-4 w-full rounded-2xl border-2 border-dashed px-6 py-12 transition-all disabled:cursor-wait disabled:opacity-70 ${previews.length ? "border-pca-green bg-pca-green-light" : "border-pca-border hover:bg-pca-bg"}`}>
                {preparingUploads ? (
                  <LoadingRing size="h-10 w-10" />
                ) : previews.length ? (
                  <IconCheck size={40} className="mx-auto text-pca-green" />
                ) : (
                  <IconCamera size={48} className="mx-auto text-pca-green" />
                )}
                <h4 className="mt-3 font-bold text-lg">
                  {preparingUploads
                    ? lang === "hil"
                      ? "Ginapreparar ang mga litrato..."
                      : "Preparing photos..."
                    : previews.length
                      ? FARMER_I18N.uploaded[lang]
                      : FARMER_I18N.tapUpload[lang]}
                </h4>
                <p className="text-xs font-medium text-pca-muted">
                  {previews.length} / 10 {FARMER_I18N.photos[lang]} · Sector {sector}
                </p>
              </button>
              <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />

              {previews.length > 0 && (
                <div className="mb-6 grid grid-cols-5 gap-2">
                  {previews.map((src, idx) => (
                    <div key={idx} className="relative aspect-square overflow-hidden rounded-xl border border-pca-border">
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removePreview(idx)} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-pca-red text-[10px] text-white shadow-md">&times;</button>
                    </div>
                  ))}
                </div>
              )}

              <button type="button" disabled={!previews.length || preparingUploads || analyzing} onClick={startAnalyze} className="flex w-full items-center justify-center gap-2 rounded-xl bg-pca-green py-4 font-bold text-white shadow-lg shadow-pca-green/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 active:translate-y-0">
                {FARMER_I18N.nextAnalyze[lang]} <IconArrowRight size={18} />
              </button>
              {analyzeError && (
                <p className="mt-3 rounded-xl border border-pca-red/20 bg-pca-red-light px-4 py-3 text-sm font-semibold text-pca-red">
                  {analyzeError}
                </p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="f-card animate-fade-in py-20 text-center max-w-2xl mx-auto">
            {analyzing ? (
              <>
                <div className="mb-6">
                  <LoadingRing />
                </div>
                <h2 className="text-2xl font-black tracking-tight">{FARMER_I18N.analyzing[lang]}</h2>
                <p className="mt-2 text-pca-muted font-medium italic">
                  AI is scanning {uploadedFiles.length} {uploadedFiles.length === 1 ? 'photo' : 'photos'}...
                </p>
              </>
            ) : (
              <>
                <IconAlertCircle size={56} className="mx-auto mb-5 text-pca-red" />
                <h2 className="text-2xl font-black tracking-tight">
                  {lang === "hil" ? "Wala natapos ang analysis" : "Analysis did not finish"}
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-relaxed text-pca-muted">
                  {analyzeError ?? (lang === "hil" ? "Sulayi liwat ang isa ka klaro nga litrato." : "Try again with one clear photo.")}
                </p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mx-auto mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-pca-green px-5 py-3 text-sm font-bold text-white shadow-lg shadow-pca-green/20"
                >
                  <IconArrowLeft size={18} />
                  {lang === "hil" ? "Balik sa upload" : "Back to upload"}
                </button>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in grid grid-cols-1 gap-6 md:grid-cols-12">
            {/* Primary Result Column */}
            <div className="md:col-span-7 space-y-6">
              <div className="f-card !mb-0 overflow-hidden !p-0">
                <div className={`p-6 border-l-8 ${cardClass === "healthy" ? "border-pca-green bg-pca-green-light" : cardClass === "warning" ? "border-orange-500 bg-orange-50" : "border-pca-red bg-pca-red-light"}`}>
                  <h3 className={`mb-3 flex items-center gap-2.5 text-2xl font-black ${cardClass === "healthy" ? "text-pca-green" : cardClass === "warning" ? "text-orange-700" : "text-pca-red"}`}>
                    {detectedPest === "healthy" ? <IconCircleCheck size={28} /> : <IconAlertCircle size={28} />}
                    {rec.title}
                  </h3>
                  <p className="mb-5 text-sm font-medium leading-relaxed text-pca-text/80">{rec.desc}</p>
                  <div className="rounded-2xl bg-white/80 p-5 text-[14px] shadow-sm backdrop-blur-sm">
                    <div className="mb-2 text-[11px] font-black uppercase tracking-widest text-pca-muted">{rec.heading}</div>
                    <p className="font-bold text-pca-text">{rec.rec}</p>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-2 gap-4 bg-pca-bg/30">
                  <div className="rounded-xl border border-pca-border bg-white p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-pca-muted mb-1">Confidence</div>
                    <div className={`text-xl font-black ${isUncertain ? 'text-orange-600' : 'text-pca-green'}`}>
                      {confidencePct}%
                    </div>
                  </div>
                  <div className="rounded-xl border border-pca-border bg-white p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-pca-muted mb-1">Majority</div>
                    <div className="text-xl font-black truncate">{majorityClass ? CLASS_DISPLAY[majorityClass].en : '—'}</div>
                  </div>
                </div>
              </div>

              {photoCounts && photoSharePct && (
                <div className="f-card !mb-0">
                  <h3 className="mb-5 text-[15px] font-black uppercase tracking-wider text-pca-text">Breakdown by condition</h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {CLASS_ORDER.map((name) => {
                      const count = photoCounts[name] ?? 0;
                      const share = photoSharePct[name] ?? 0;
                      const meta = CLASS_DISPLAY[name];
                      if (count === 0 && photosAnalyzed > 1) return null;
                      return (
                        <div key={name}>
                          <div className="mb-2 flex justify-between items-end">
                            <span className="text-[13px] font-bold">{lang === "hil" ? meta.hil : meta.en}</span>
                            <span className="text-xs font-black tabular-nums">{count} {lang === "hil" ? 'ka litrato' : 'photos'}</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-pca-bg border border-pca-border">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(4, share)}%`, background: meta.barColor }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {perImageResults.length > 1 && (
                <div className="f-card !mb-0">
                  <h3 className="mb-4 text-[15px] font-black uppercase tracking-wider text-pca-text">Per-photo analysis</h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {perImageResults.map((row) => {
                      const topLabel = getTopClassFromPredictions(row.result.predictions);
                      const meta = CLASS_DISPLAY[topLabel];
                      return (
                        <div key={`${row.index}-${row.fileName}`} className="flex items-center gap-3 rounded-xl border border-pca-border bg-white p-2.5 transition-all hover:border-pca-green-soft">
                          <img src={row.previewUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-bold text-pca-text">
                              {lang === "hil" ? meta.hil : meta.en}
                            </div>
                            <div className="truncate text-[10px] text-pca-muted font-medium">{row.result.confidence.toFixed(1)}% confidence</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Actions & Context Column */}
            <div className="md:col-span-5 space-y-6">
              <div className="f-card !mb-0">
                <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-pca-muted">Verify & Submit</h3>
                <div className="mb-6 rounded-2xl border-2 border-pca-border p-5">
                  <div className="mb-4 text-[15px] font-bold">{lang === "hil" ? "Husto bala ang resulta?" : "Is the result correct?"}</div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => confirmResult(true)} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 text-[14px] font-bold transition-all ${feedback === "yes" ? "border-pca-green bg-pca-green-light text-pca-green" : "border-pca-border hover:bg-pca-bg"}`}><IconThumbUp size={18} />{lang === "hil" ? "Oo" : "Yes"}</button>
                    <button type="button" onClick={() => confirmResult(false)} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 text-[14px] font-bold transition-all ${feedback === "no" ? "border-pca-red bg-pca-red-light text-pca-red" : "border-pca-border hover:bg-pca-bg"}`}><IconThumbDown size={18} />{lang === "hil" ? "Indi" : "No"}</button>
                  </div>
                  {feedbackMsg && <p className={`mt-4 rounded-xl px-4 py-3 text-xs font-bold ${feedback === "yes" ? "bg-pca-green-light text-pca-green" : "bg-pca-red-light text-pca-red"}`}>{feedbackMsg}</p>}
                </div>

                <div className="flex flex-col gap-3">
                  <button type="button" onClick={submitResult} className="flex items-center justify-center gap-2 rounded-xl bg-pca-green py-4 text-[16px] font-bold text-white shadow-lg shadow-pca-green/20 transition-all hover:-translate-y-0.5"><IconSend size={20} />{lang === "hil" ? "Ipadala sa PCA" : "Send to PCA"}</button>
                  <button type="button" onClick={() => { resetUploadSession(); setStep(1); }} className="rounded-xl border border-pca-border py-4 text-[15px] font-bold text-pca-muted transition-all hover:bg-pca-bg hover:text-pca-text">{lang === "hil" ? "Mag-uli" : "Start over"}</button>
                </div>
              </div>

              <div className="f-card !mb-0">
                <h3 className="mb-4 text-[15px] font-black uppercase tracking-wider text-pca-text">Sector Context</h3>
                <div className="space-y-1">
                  {(sectorRows.length ? sectorRows : ["A", "B", "C", "D"].map((code) => ({ code, label_en: "No report", label_hil: "Wala pa", color: "#9ca3af" }))).map((s) => (
                    <div key={s.code} className="flex items-center gap-3 border-b border-pca-border/50 py-3 last:border-0">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                      <span className="flex-1 text-[14px] font-bold">Sector {s.code}</span>
                      <span className="rounded-lg bg-pca-bg px-2.5 py-1 text-[11px] font-bold text-pca-muted">
                        {lang === "hil" ? s.label_hil : s.label_en}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="f-card !mb-0">
                <h3 className="mb-4 flex items-center gap-2 text-[15px] font-black uppercase tracking-wider text-pca-text">
                  <IconHistory size={20} className="text-pca-green" />
                  {lang === "hil" ? "Mga Nakaaging Surbi" : "Recent History"}
                </h3>
                <div className="space-y-3">
                  {farmerSubmissions.slice(0, 3).map((p, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-pca-border p-3 shadow-sm">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-pca-text">{p.date}</div>
                        <div className="text-[10px] font-bold text-pca-muted uppercase tracking-tight">Sector {p.sector}</div>
                      </div>
                      <span className="rounded-lg bg-pca-green-light px-2 py-1 text-[10px] font-black text-pca-green uppercase">{p.tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
