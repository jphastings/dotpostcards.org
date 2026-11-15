import data from "./cards.json";

export type Flip = "book" | "calendar" | "left-hand" | "right-hand" | "none";

export interface Side {
  description?: string;
  transcription?: {
    text?: string;
    annotations?: { type: string; value: string; start: number; end: number }[];
  };
  secrets?: { prehidden: boolean; points: [number, number][] }[];
}

export interface Card {
  name: string;
  src: string;
  flip: Flip;
  locale?: string;
  location?: { name?: string; latitude?: number; longitude?: number; countrycode?: string };
  sentOn?: string;
  sender?: { name?: string; uri?: string };
  recipient?: { name?: string; uri?: string };
  front: Side;
  back?: Side;
  context?: { author?: { name?: string; uri?: string }; description?: string };
  physical: { frontSize: { cmW: string; cmH: string; pxW: number; pxH: number } };
}

const stored = data as unknown as Record<string, Omit<Card, "name" | "src">>;

export function getCard(name: string): Card {
  const card = stored[name];
  if (!card) throw new Error(`Unknown card: ${name}`);
  return { ...card, name, src: `/cards/${name}.postcard.webp` };
}

export const isHeteroriented = (flip: Flip) => flip === "left-hand" || flip === "right-hand";

export function orientation(card: Card): "portrait" | "landscape" | "square" {
  const { pxW, pxH } = card.physical.frontSize;
  return pxW === pxH ? "square" : pxW < pxH ? "portrait" : "landscape";
}

export function cm(fraction: string): string {
  const [numerator, denominator = "1"] = fraction.split("/");
  return `${(Number(numerator) / Number(denominator)).toFixed(1)} cm`;
}

export function sideSize(card: Card, side: "front" | "back") {
  const { cmW, cmH } = card.physical.frontSize;
  const swap = side === "back" && isHeteroriented(card.flip);
  return { width: cm(swap ? cmH : cmW), height: cm(swap ? cmW : cmH) };
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

export function transcriptionLanguage(side: Side): string | undefined {
  const locale = side.transcription?.annotations?.find((a) => a.type === "locale")?.value;
  const language = locale?.split("-")[0];
  return language && new Intl.DisplayNames(["en"], { type: "language" }).of(language);
}

export const arModel = (card: Card) => ({
  href: `https://shutup.jp/${card.name}.postcard.usdz`,
  label: `View the ${card.location?.name ?? card.name} postcard in AR`,
});
