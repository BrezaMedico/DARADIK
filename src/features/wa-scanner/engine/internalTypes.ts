import type { PSM } from 'tesseract.js';
import type { BoundingBox, OcrWordDetail, UncertaintyStatus } from '@/types/scanner';
import type { BospRealizationItem } from '@/types/school';

export interface RawOcrWord {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  passName: string;
  alternatives: string[];
}

export interface RawOcrLine {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  words: RawOcrWord[];
  passName: string;
}

export interface ImageVariant {
  name: string;
  dataUrl: string;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  psm: PSM;
}

export interface ReconciledLine {
  bbox: BoundingBox;
  words: OcrWordDetail[];
  text: string;
  cleanText: string;
  confidence: number;
  uncertaintyStatus: UncertaintyStatus;
  uncertaintyNotes: string[];
  alternatives: string[];
  passSources: string[];
}

export interface EnrichedToken {
  raw: string;
  stem: string;
  phonetic: string;
  isKnownDistinct: boolean;
}

export interface EnrichedMessageDoc {
  originalText: string;
  normalizedText: string;
  tokens: EnrichedToken[];
  contentTokens: EnrichedToken[];
}

export interface CoercionLevyAnalysis {
  isMandatory: boolean;
  isDisguisedCoercion: boolean;
  hasAcademicSanction: boolean;
  hasBindingDeadline: boolean;
  hasFixedTariff: boolean;
  hasExplicitObligation: boolean;
  hasBureaucraticPressure: boolean;
  hasPaymentDirective: boolean;
  hasPureVoluntary: boolean;
  hasFinancialOrLevyContext: boolean;
  coercionScore: number;
  matchedCoercionSignals: string[];
  toneLabel: string;
  toneBadge: string;
}

export interface BudgetItemMatchResult {
  item: BospRealizationItem;
  matchedKeyword: string;
  score: number;
}

export interface KamusBospRuleMatch {
  id: string;
  categoryTitle: string;
  matchedPhrase: string;
  score: number;
  kind:
    | 'BOSP_FUNDED_OPERATIONAL'
    | 'PROHIBITED_STRUCTURAL_LEVY'
    | 'ACADEMIC_RIGHTS_SANCTION'
    | 'UNIFORM_ATTIRE_RULE'
    | 'NON_RKAS_PAGUYUBAN';
  primaryRegulation: string;
  statusTitleDanger: string;
  statusTitleSafe?: string;
  bospFactBuilder: (ctx: {
    schoolName: string;
    schoolType: string;
    matchedPhrase: string;
    compMatch: { label: string; amount: number; stage: string } | null;
    tarikanStr: string;
    totalTarikanStr: string;
    studentCount: number;
    isMandatory: boolean;
  }) => string;
  legalNoteDanger: string;
  legalNoteSafe?: string;
  matchedComposition: { label: string; amount: number; stage: string; code: string } | null;
}
