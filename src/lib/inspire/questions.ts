/**
 * Inspire flow question config — adding a new question or option
 * means appending here. The renderer reads this and maps `type` → UI.
 */
export type InspireQuestionType = "visual-multi" | "single" | "text";

export interface InspireOption {
  id: string;
  labelKey: string; // i18n key
  emoji?: string;
}

export interface InspireQuestion {
  id: string;
  type: InspireQuestionType;
  titleKey: string;
  subtitleKey: string;
  emoji: string;
  options?: InspireOption[];
  placeholderKey?: string;
  optional?: boolean;
}

export const INSPIRE_QUESTIONS: InspireQuestion[] = [
  {
    id: "tripType",
    type: "visual-multi",
    titleKey: "inspire.q.tripType.title",
    subtitleKey: "inspire.q.tripType.subtitle",
    emoji: "✨",
    options: [
      { id: "newyear", labelKey: "inspire.tripType.newyear", emoji: "🎆" },
      { id: "beach", labelKey: "inspire.tripType.beach", emoji: "🏖️" },
      { id: "adventure", labelKey: "inspire.tripType.adventure", emoji: "🧗" },
      { id: "romantic", labelKey: "inspire.tripType.romantic", emoji: "💕" },
      { id: "family", labelKey: "inspire.tripType.family", emoji: "👨‍👩‍👧" },
      { id: "food", labelKey: "inspire.tripType.food", emoji: "🍝" },
      { id: "nature", labelKey: "inspire.tripType.nature", emoji: "🌲" },
      { id: "party", labelKey: "inspire.tripType.party", emoji: "🎉" },
      { id: "culture", labelKey: "inspire.tripType.culture", emoji: "🏛️" },
      { id: "relax", labelKey: "inspire.tripType.relax", emoji: "🧘" },
    ],
  },
  {
    id: "region",
    type: "single",
    titleKey: "inspire.q.region.title",
    subtitleKey: "inspire.q.region.subtitle",
    emoji: "🌍",
    options: [
      { id: "spain", labelKey: "inspire.region.spain", emoji: "🇪🇸" },
      { id: "europe", labelKey: "inspire.region.europe", emoji: "🇪🇺" },
      { id: "anywhere", labelKey: "inspire.region.anywhere", emoji: "🌐" },
    ],
  },
  {
    id: "budget",
    type: "single",
    titleKey: "inspire.q.budget.title",
    subtitleKey: "inspire.q.budget.subtitle",
    emoji: "💰",
    options: [
      { id: "low", labelKey: "inspire.budget.low", emoji: "🪙" },
      { id: "mid", labelKey: "inspire.budget.mid", emoji: "💳" },
      { id: "high", labelKey: "inspire.budget.high", emoji: "💎" },
    ],
  },
  {
    id: "origin",
    type: "text",
    titleKey: "inspire.q.origin.title",
    subtitleKey: "inspire.q.origin.subtitle",
    emoji: "🛫",
    placeholderKey: "inspire.q.origin.placeholder",
  },
  {
    id: "duration",
    type: "single",
    titleKey: "inspire.q.duration.title",
    subtitleKey: "inspire.q.duration.subtitle",
    emoji: "📅",
    options: [
      { id: "weekend", labelKey: "inspire.duration.weekend", emoji: "🗓️" },
      { id: "short", labelKey: "inspire.duration.short", emoji: "📆" },
      { id: "week", labelKey: "inspire.duration.week", emoji: "🌅" },
      { id: "long", labelKey: "inspire.duration.long", emoji: "✈️" },
    ],
  },
];

export type InspireAnswers = {
  tripType: string[];
  region: string;
  budget: string;
  origin: string;
  duration: string;
};
