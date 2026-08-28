import type { PestType } from "../types/demoStore";
import { getApiBase, getAuthHeaders, isApiEnabled, parseErrorMessage } from "./api";

export interface PredictResult {
  pest: PestType;
  label: string;
  confidence: number;
  uncertain: boolean;
  predictions: Record<string, number>;
  thresholdedLabels: string[];
  topGuesses: string[];
  message?: string;
}

export interface PerImagePredictResult {
  index: number;
  fileName: string;
  previewUrl: string;
  result: PredictResult;
}

export interface AggregatedPredictResult {
  pest: PestType;
  label: string;
  /** Average confidence (%) for photos classified under the majority condition. */
  confidence: number;
  uncertain: boolean;
  photoCounts: Record<string, number>;
  /** Share of total photos (0–100) per condition — used for bar width. */
  photoSharePct: Record<string, number>;
  majorityClass: (typeof CLASS_ORDER)[number];
  perImage: PerImagePredictResult[];
  message?: string;
}

const UNCERTAIN_MAX_PCT = 40;
const MAX_UPLOAD_IMAGE_SIDE = 1280;
const UPLOAD_JPEG_QUALITY = 0.82;
const PREDICT_TIMEOUT_MS = 45_000;

export const CLASS_ORDER = [
  "Healthy",
  "Yellowing",
  "Coconut_Scale_Insect",
  "Rhinoceros_Beetle",
] as const;

const LABEL_TO_PEST: Record<string, PestType> = {
  Healthy: "healthy",
  Yellowing: "yellowing",
  Coconut_Scale_Insect: "scale insect",
  Rhinoceros_Beetle: "rhino beetle",
};

/** When photo counts tie, prefer the more severe condition for the farm summary. */
const PEST_PRIORITY = [
  "Rhinoceros_Beetle",
  "Coconut_Scale_Insect",
  "Yellowing",
  "Healthy",
] as const;

export const CLASS_DISPLAY: Record<
  (typeof CLASS_ORDER)[number],
  { en: string; hil: string; pest: PestType; barColor: string }
> = {
  Healthy: { en: "Healthy", hil: "Maayo", pest: "healthy", barColor: "#22a355" },
  Yellowing: { en: "Yellowing", hil: "Nagdilaw", pest: "yellowing", barColor: "#f59e0b" },
  Coconut_Scale_Insect: {
    en: "Coconut Scale Insect",
    hil: "Lisap (CSI)",
    pest: "scale insect",
    barColor: "#dc2626",
  },
  Rhinoceros_Beetle: {
    en: "Rhinoceros Beetle",
    hil: "Bagangan",
    pest: "rhino beetle",
    barColor: "#b91c1c",
  },
};

const PEST_KEYS: PestType[] = ["healthy", "yellowing", "scale insect", "rhino beetle"];

function normalizePest(value: string): PestType {
  if (PEST_KEYS.includes(value as PestType)) return value as PestType;
  return "healthy";
}

async function prepareImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not load image"));
    });
    image.src = objectUrl;
    await loaded;

    const scale = Math.min(1, MAX_UPLOAD_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    if (scale === 1 && file.size <= 1_500_000) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", UPLOAD_JPEG_QUALITY);
    });
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "leaf-photo";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: file.lastModified });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Winning class for one photo = highest score in that image's breakdown. */
export function getTopClassFromPredictions(
  predictions: Record<string, number>,
): (typeof CLASS_ORDER)[number] {
  let best: (typeof CLASS_ORDER)[number] = CLASS_ORDER[0];
  let bestScore = -1;
  for (const name of CLASS_ORDER) {
    const score = predictions[name] ?? 0;
    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  }
  return best;
}

function pickMajorityClass(photoCounts: Record<string, number>): (typeof CLASS_ORDER)[number] {
  const maxCount = Math.max(...CLASS_ORDER.map((name) => photoCounts[name] ?? 0));
  for (const name of PEST_PRIORITY) {
    if ((photoCounts[name] ?? 0) === maxCount) return name;
  }
  return CLASS_ORDER[0];
}

export function summarizeFromPerImage(perImage: PerImagePredictResult[]): AggregatedPredictResult {
  const total = perImage.length;
  const photoCounts: Record<string, number> = {};
  for (const name of CLASS_ORDER) photoCounts[name] = 0;

  const byClass: Record<string, number[]> = {};
  for (const name of CLASS_ORDER) byClass[name] = [];

  for (const row of perImage) {
    const topClass = getTopClassFromPredictions(row.result.predictions);
    photoCounts[topClass] = (photoCounts[topClass] ?? 0) + 1;
    const score = row.result.predictions[topClass] ?? row.result.confidence;
    byClass[topClass]!.push(score);
  }

  const photoSharePct: Record<string, number> = {};
  for (const name of CLASS_ORDER) {
    photoSharePct[name] = total > 0 ? Math.round(((photoCounts[name] ?? 0) / total) * 1000) / 10 : 0;
  }

  const majorityClass = pickMajorityClass(photoCounts);
  const majorityScores = byClass[majorityClass] ?? [];
  const confidence =
    majorityScores.length > 0
      ? Math.round(
          (majorityScores.reduce((sum, value) => sum + value, 0) / majorityScores.length) * 10,
        ) / 10
      : 0;

  const anyUncertain = perImage.some((row) => row.result.uncertain);
  const uncertain = anyUncertain || confidence < UNCERTAIN_MAX_PCT;

  const pest = LABEL_TO_PEST[majorityClass] ?? "healthy";

  return {
    pest,
    label: majorityClass.replace(/_/g, " "),
    confidence,
    uncertain,
    photoCounts,
    photoSharePct,
    majorityClass,
    perImage,
    message: uncertain
      ? "Low confidence on one or more photos. Flagged for expert review."
      : undefined,
  };
}

export async function predictLeafImage(
  file: File,
): Promise<{ success: true; result: PredictResult } | { success: false; message: string }> {
  if (!isApiEnabled()) {
    return { success: false, message: "API URL is not configured." };
  }

  const form = new FormData();
  const uploadFile = await prepareImageForUpload(file);
  form.append("file", uploadFile, uploadFile.name);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), PREDICT_TIMEOUT_MS);

  try {
    const response = await fetch(`${getApiBase()}/predict`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: form,
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        success: false,
        message: await parseErrorMessage(response, "Could not analyze the image."),
      };
    }

    const data = (await response.json()) as {
      pest: string;
      label: string;
      confidence: number;
      uncertain: boolean;
      predictions: Record<string, number>;
      thresholded_labels: string[];
      top_guesses: string[];
      message?: string;
    };

    return {
      success: true,
      result: {
        pest: normalizePest(data.pest),
        label: data.label,
        confidence: data.confidence,
        uncertain: data.uncertain,
        predictions: data.predictions,
        thresholdedLabels: data.thresholded_labels,
        topGuesses: data.top_guesses,
        message: data.message,
      },
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        success: false,
        message: "Analysis is taking too long. Please try again with one clear coconut leaf photo.",
      };
    }
    return { success: false, message: "Cannot reach the analysis server. Try again later." };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function predictLeafImages(
  items: { file: File; previewUrl: string }[],
): Promise<
  | { success: true; aggregated: AggregatedPredictResult }
  | { success: false; message: string }
> {
  if (!items.length) {
    return { success: false, message: "No images to analyze." };
  }

  const outcomes = await Promise.all(
    items.map(async (item, index) => {
      const outcome = await predictLeafImage(item.file);
      return { index, item, outcome };
    }),
  );

  const failed = outcomes.find((o) => !o.outcome.success);
  if (failed && !failed.outcome.success) {
    return { success: false, message: failed.outcome.message };
  }

  const perImage: PerImagePredictResult[] = [];

  for (const row of outcomes) {
    if (!row.outcome.success) continue;
    perImage.push({
      index: row.index,
      fileName: row.item.file.name,
      previewUrl: row.item.previewUrl,
      result: row.outcome.result,
    });
  }

  const aggregated = summarizeFromPerImage(perImage);
  return { success: true, aggregated };
}
