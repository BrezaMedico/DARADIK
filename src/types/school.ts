export interface InvoiceLineItem {
  name: string;
  qty: string;
  unitPrice: number;
  subtotal: number;
}

export interface BospRealizationItem {
  id: string;
  code: string;
  name: string;
  unitSummary: string;
  amount: number;
  category: string;
  aiCategoryPath: string;
  date: string;
  stage: 'Tahap 1' | 'Tahap 2';
  allocation: string;
  iconType: 'fan' | 'paint' | 'book' | 'projector' | 'sanitation' | 'desk';
  keywords: string[];
  invoice: {
    number: string;
    vendorName: string;
    vendorAddress: string;
    npwp: string;
    date: string;
    treasurerName: string;
    principalName: string;
    lineItems: InvoiceLineItem[];
  };
  geotag: {
    lat: string;
    lng: string;
    roomLabel: string;
    uploadedAt: string;
    inspectorNote: string;
    conditionStatus: string;
  };
  photoUrl?: string;
}

export type SchoolOwnershipType = 'Negeri' | 'Swasta';
export type SchoolEducationLevel = 'SD' | 'SMP' | 'SMA' | 'SMK';

export interface BudgetComposition {
  id: string;
  label: string;
  percentage: number;
  amount: number;
  color: string;
  description: string;
  regulationRule?: string;
  complianceStatus?: string;
}

export interface SchoolYearHistory {
  year: string;
  isCurrentYear: boolean;
  studentCount?: number;
  perStudentEstimate?: number;
  totalBosp: number;
  tahap1: {
    amount: number;
    period: string;
    status: string;
    disbursedDate: string;
  };
  tahap2: {
    amount: number;
    period: string;
    status: string;
    disbursedDate: string;
  };
  compositions: BudgetComposition[];
  tahap1Compositions?: BudgetComposition[];
  tahap2Compositions?: BudgetComposition[];
  items: BospRealizationItem[];
}

export interface SchoolData {
  id: string;
  name: string;
  npsn: string;
  sampleNisn: string;
  principalName?: string;
  treasurerName?: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  address: string;
  status: string;
  schoolType?: SchoolOwnershipType;
  educationLevel?: SchoolEducationLevel;
  jenjang: SchoolEducationLevel | string;
  maxHonorariumLimit?: number;
  regionCostZone?: string;
  studentCount: number;
  perStudentEstimate: number;
  totalBosp: number;
  tahap1: {
    amount: number;
    period: string;
    status: string;
    disbursedDate: string;
  };
  tahap2: {
    amount: number;
    period: string;
    status: string;
    disbursedDate: string;
  };
  compositions: BudgetComposition[];
  tahap1Compositions?: BudgetComposition[];
  tahap2Compositions?: BudgetComposition[];
  items: BospRealizationItem[];
  imageUrl?: string;
}

export interface WaScenarioData {
  id: 'scenario-a' | 'scenario-b';
  buttonLabel: string;
  shortTitle: string;
  fileName: string;
  groupName: string;
  timestamp: string;
  statusType: 'danger' | 'safe';
  statusHeader: string;
  ocrQuote: string;
  bospFact: string;
  legalReminder?: string;
  reportCategoryPrefill: string;
  attachmentLabel: string;
  primaryButtonLabel: string;
}

export interface KamusBospItem {
  title: string;
  detail: string;
  ref: string;
}

export type AppView =
  | 'landing'
  | 'school-search'
  | 'school-profile'
  | 'anonymous-report'
  | 'live-tracking'
  | 'kamus-bosp'
  | 'dinas-dashboard';

