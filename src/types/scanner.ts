import type { BospRealizationItem, BudgetComposition } from './school';

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export type RiskZoneType =
  | 'small_text'
  | 'low_contrast'
  | 'complex_background'
  | 'compressed_or_blurry'
  | 'edge_proximity'
  | 'overlapping_ui'
  | 'busy_background'
  | 'compressed_artifact'
  | 'tiny_text'
  | 'overlapping_watermark';

export interface RiskZone {
  id: string;
  type: RiskZoneType;
  label?: string;
  bbox: BoundingBox;
  normBbox: { x: number; y: number; w: number; h: number };
  severity: 'low' | 'medium' | 'high';
  description?: string;
}

export interface CandidateTextZone {
  id?: string;
  bbox: BoundingBox;
  normBbox: { x: number; y: number; w: number; h: number };
  strokeDensity: number;
  localContrast?: number;
  contrastScore?: number;
  densityScore?: number;
  meanLuminance: number;
  zoneHint:
    | 'status_bar'
    | 'header'
    | 'chat_body'
    | 'embedded_media'
    | 'edge_margin'
    | 'footer';
  isLowContrastOrBlurry?: boolean;
}

export interface ImageDiagnostics {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: 'portrait' | 'landscape' | 'square';
  isTallScreenshot: boolean;
  isLowResolution: boolean;
  meanBrightness: number;
  contrastScore: number;
  sharpnessScore: number;
  compressionArtifactScore: number;
  backgroundComplexityScore: number;
  dominantTheme: 'light' | 'dark' | 'mixed' | 'colored_or_patterned';
  qualityWarnings: string[];
  structuralZones: {
    headerBandY: number;
    footerBandY: number;
    hasEmbeddedMedia: boolean;
    embeddedMediaBoxes: BoundingBox[];
  };
  riskZones: RiskZone[];
  candidateZones: CandidateTextZone[];
}

export interface SchoolScannerContext {
  schoolName?: string;
  studentCount?: number;
  schoolType?: 'Negeri' | 'Swasta' | string;
  educationLevel?: 'SD' | 'SMP' | 'SMA' | 'SMK' | string;
  totalBosp?: number;
  compositions?: BudgetComposition[];
  tahap1Compositions?: BudgetComposition[];
  tahap2Compositions?: BudgetComposition[];
}

export interface ImagePreprocessAdjustments extends SchoolScannerContext {
  rotationDeg?: number;
  deskewDeg?: number;
  cropRect?: { x: number; y: number; width: number; height: number } | null;
  enhanceContrast?: boolean;
  enableVisionAi?: boolean;
  visionApiKey?: string;
  referenceGroundTruth?: string;
}

export type RegionCategory =
  | 'status_bar'
  | 'header'
  | 'date_separator'
  | 'quoted_reply'
  | 'message_incoming'
  | 'message_outgoing'
  | 'embedded_media_text'
  | 'footer_interface'
  | 'edge_or_floating'
  | 'detected_text';

export type UncertaintyStatus = 'certain' | 'uncertain' | 'unreadable';

export interface OcrWordDetail {
  text: string;
  rawText: string;
  confidence: number;
  bbox: BoundingBox;
  uncertaintyStatus: UncertaintyStatus;
  alternatives: string[];
  passSource: string;
}

export interface DetectedTextRegion {
  id: string;
  orderIndex: number;
  category: RegionCategory;
  categoryLabel: string;
  senderName: string | null;
  timestamp: string | null;
  quotedText: string | null;
  text: string;
  cleanText: string;
  confidence: number;
  uncertaintyStatus: UncertaintyStatus;
  uncertaintyNotes: string[];
  alternatives: string[];
  passSources: string[];
  bbox: BoundingBox;
  normBbox: { x: number; y: number; w: number; h: number };
  cropDataUrl?: string;
  words: OcrWordDetail[];
}

export interface OcrPipelineProgressInfo {
  stage: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  stageTitle: string;
  stageDetail: string;
  progressPct: number;
}

export interface OcrEvaluationMetrics {
  cer: number;
  wer: number;
  characterAccuracyPct: number;
  wordAccuracyPct: number;
  regionCompletenessPct: number;
  missedWordsCount: number;
  missedWordsSample: string[];
  missedLinesCount: number;
  readingOrderScorePct: number;
  uncertaintyMarkingValid: boolean;
  evaluationSummary: string;
}

export interface FinancialComparisonData {
  nominalPerStudent: number | null;
  totalCollectedEstimate: number | null;
  bospAllocatedAmount: number | null;
  itemCode: string | null;
  disbursedPeriod: string | null;
  disbursedDate: string | null;
  discrepancyVerdict: string;
}

export interface PolicyRuleCheck {
  id: string;
  ruleTitle: string;
  regulation: string;
  status: 'violation' | 'warning' | 'compliant';
  verdictLabel: string;
  explanation: string;
}

export interface ThreeWayComparison {
  teacherText: {
    sourceType: 'screenshot' | 'direct_text';
    quote: string;
    detectedItem: string;
    detectedAmount: number | null;
    isMandatory: boolean;
    toneLabel: string;
    toneBadge?: string;
  };
  schoolBudget: {
    schoolName: string;
    isFundedByBosp: boolean;
    itemCode: string | null;
    allocatedAmount: number | null;
    stage: string | null;
    factText: string;
    budgetStatusLabel?: string;
  };
  bospPolicy: {
    verdictType:
      | 'PUNGLI_BOSP'
      | 'PUNGLI_PEMAKSAAN'
      | 'PUNGLI_REGULASI_BOSP'
      | 'SUMBANGAN_SUKARELA_SAH'
      | 'BELUM_TERIDENTIFIKASI';
    verdictTitle: string;
    policySummary: string;
    primaryRegulation?: string;
    rules: PolicyRuleCheck[];
  };
}

export interface AiScanAnalysisResult {
  rawOcrText: string;
  fullStructuredTranscript: string;
  detectedQuote: string;
  detectedAmount: number | null;
  detectedItemKeyword: string | null;
  isMandatoryTone: boolean;
  statusType: 'danger' | 'safe' | 'neutral';
  statusTitle: string;
  bospFact: string;
  matchedItem: BospRealizationItem | null;
  legalNote: string;
  confidenceScore: number;
  financialComparison: FinancialComparisonData;
  sourceType?: 'screenshot' | 'direct_text';
  threeWayComparison?: ThreeWayComparison;
  diagnostics: ImageDiagnostics;
  regions: DetectedTextRegion[];
  uncertainRegionsCount: number;
  unreadableRegionsCount: number;
  passesExecuted: string[];
  reconciledDiffsCount: number;
  processedPreviewDataUrl: string;
  privacyMode: 'local-browser' | 'hybrid-vision-ai' | 'vision-assisted';
  evaluationMetrics?: OcrEvaluationMetrics;
}
