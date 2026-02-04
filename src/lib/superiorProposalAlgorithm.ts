// Superior Proposal Algorithm
// Logic module for fitness center calculator with SF, budget, and demographic-based equipment focus

export const DEFAULTS = {
  adultsPerUnit: 1.45,
  residentsPercent: 35,   // % of total adults who will use the fitness center
  peakPercent: 60,        // % of gym users considered "peak gym users"
  peakDays: 5,            // number of peak days per week
  ibcFactor: 50,          // SF per daily peak user
  propertyClass: "B" as PropertyClass,
  classPricing: { A: 105, B: 60, C: 40 } as Record<PropertyClass, number>,
  categoryWeights: { Age: 6, Gender: 5, Income: 4, Location: 3 } as Record<DemographicCategory, number>
};

export type PropertyClass = "A" | "B" | "C";

export type DemographicCategory = "Gender" | "Age" | "Income" | "Location";

export type GenderSegment = "Men" | "Women";
export type AgeSegment = "20-30" | "31-40" | "41-50" | "51-60" | "61-70";
export type IncomeSegment = "High" | "Medium" | "Low";
export type LocationSegment = "Urban" | "Suburban" | "Rural";

export type DemographicSegment = GenderSegment | AgeSegment | IncomeSegment | LocationSegment;

export type EquipmentType = "Cardio" | "Strength" | "Free Weights" | "Selectorized" | "Functional" | "Connected";

export type ScoreLabel = "Low" | "Low-Medium" | "Medium" | "Medium-High" | "High";

interface DemographicSegmentData {
  Cardio: ScoreLabel;
  Strength: ScoreLabel;
  "Free Weights": ScoreLabel;
  Selectorized: ScoreLabel;
  Functional: ScoreLabel;
  Connected: ScoreLabel;
  usage: number;
}

export const demographicData: Record<DemographicCategory, Record<string, DemographicSegmentData>> = {
  Gender: {
    Men: { Cardio: "Medium", Strength: "High", "Free Weights": "High", Selectorized: "Medium", Functional: "Medium", Connected: "Medium", usage: 28 },
    Women: { Cardio: "High", Strength: "Medium", "Free Weights": "Low-Medium", Selectorized: "High", Functional: "High", Connected: "High", usage: 25 }
  },
  Age: {
    "20-30": { Cardio: "High", Strength: "High", "Free Weights": "High", Selectorized: "Medium", Functional: "High", Connected: "High", usage: 35 },
    "31-40": { Cardio: "High", Strength: "High", "Free Weights": "Medium-High", Selectorized: "High", Functional: "Medium", Connected: "Medium-High", usage: 32 },
    "41-50": { Cardio: "Medium-High", Strength: "Medium-High", "Free Weights": "Medium", Selectorized: "High", Functional: "Medium", Connected: "Medium", usage: 28 },
    "51-60": { Cardio: "Medium", Strength: "Medium", "Free Weights": "Low-Medium", Selectorized: "High", Functional: "Medium-High", Connected: "Low", usage: 22 },
    "61-70": { Cardio: "Medium", Strength: "Low", "Free Weights": "Low", Selectorized: "Medium", Functional: "Medium", Connected: "Low", usage: 18 }
  },
  Income: {
    High: { Cardio: "High", Strength: "High", "Free Weights": "Medium", Selectorized: "High", Functional: "High", Connected: "High", usage: 34 },
    Medium: { Cardio: "Medium-High", Strength: "Medium-High", "Free Weights": "Medium", Selectorized: "High", Functional: "Medium", Connected: "Medium", usage: 28 },
    Low: { Cardio: "Medium", Strength: "Medium", "Free Weights": "Low", Selectorized: "Medium", Functional: "Low-Medium", Connected: "Low", usage: 20 }
  },
  Location: {
    Urban: { Cardio: "High", Strength: "Medium-High", "Free Weights": "Medium", Selectorized: "High", Functional: "High", Connected: "High", usage: 33 },
    Suburban: { Cardio: "Medium-High", Strength: "Medium-High", "Free Weights": "Medium", Selectorized: "High", Functional: "Medium", Connected: "Medium", usage: 27 },
    Rural: { Cardio: "Medium", Strength: "Medium", "Free Weights": "Low-Medium", Selectorized: "Medium", Functional: "Low", Connected: "Low", usage: 18 }
  }
};

export const EQUIPMENT_TYPES: EquipmentType[] = ["Cardio", "Strength", "Free Weights", "Selectorized", "Functional", "Connected"];

export const DEMOGRAPHIC_OPTIONS: Record<DemographicCategory, string[]> = {
  Gender: ["Men", "Women"],
  Age: ["20-30", "31-40", "41-50", "51-60", "61-70"],
  Income: ["High", "Medium", "Low"],
  Location: ["Urban", "Suburban", "Rural"]
};

function scoreLabelToNumber(label: ScoreLabel): number {
  switch (label) {
    case "Low": return 2;
    case "Low-Medium": return 3;
    case "Medium": return 4;
    case "Medium-High": return 5;
    case "High": return 6;
    default: return 4;
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface SquareFootageInput {
  units: number;
  adultsPerUnit?: number;
  residentsPercent?: number;
  peakPercent?: number;
  peakDays?: number;
  ibcFactor?: number;
}

export interface SquareFootageResult {
  ok: boolean;
  error?: string;
  source?: "calculated" | "override";
  totalAdults?: number;
  totalGymUsers?: number;
  peakGymUsers?: number;
  dailyPeakUsers?: number;
  squareFootage?: number;
}

export function calculateSquareFootage(input: SquareFootageInput): SquareFootageResult {
  const {
    units,
    adultsPerUnit = DEFAULTS.adultsPerUnit,
    residentsPercent = DEFAULTS.residentsPercent,
    peakPercent = DEFAULTS.peakPercent,
    peakDays = DEFAULTS.peakDays,
    ibcFactor = DEFAULTS.ibcFactor
  } = input;

  if (!units || units <= 0) {
    return { ok: false, error: "Units required for SF calculation." };
  }

  const totalAdults = units * adultsPerUnit;
  const totalGymUsers = totalAdults * (residentsPercent / 100);
  const peakGymUsers = totalGymUsers * (peakPercent / 100);
  const dailyPeakUsers = peakGymUsers / peakDays;
  const minSquareFootage = dailyPeakUsers * ibcFactor;

  return {
    ok: true,
    totalAdults: round2(totalAdults),
    totalGymUsers: round2(totalGymUsers),
    peakGymUsers: round2(peakGymUsers),
    dailyPeakUsers: round2(dailyPeakUsers),
    squareFootage: round2(minSquareFootage)
  };
}

export type SelectedDemographics = Partial<Record<DemographicCategory, string[]>>;

export interface DemographicAdjustmentsInput {
  selectedDemographics?: SelectedDemographics;
  categoryWeights?: Record<DemographicCategory, number>;
}

export interface EquipmentPriority {
  type: EquipmentType;
  score: number;
}

export interface DemographicAdjustmentsResult {
  equipmentScores: Record<EquipmentType, number>;
  activityLevel: "High Activity" | "Moderate Activity" | "Low Activity";
  avgUsage: number;
  topPriorities: EquipmentPriority[];
  guidance: string[];
}

export function calculateDemographicAdjustments(input: DemographicAdjustmentsInput): DemographicAdjustmentsResult {
  const {
    selectedDemographics = {},
    categoryWeights = DEFAULTS.categoryWeights
  } = input;

  const equipmentScores: Record<EquipmentType, number> = {} as Record<EquipmentType, number>;
  let totalUsage = 0;
  let totalSelections = 0;

  EQUIPMENT_TYPES.forEach((equipmentType) => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    (Object.keys(selectedDemographics) as DemographicCategory[]).forEach((category) => {
      const segments = selectedDemographics[category] || [];
      segments.forEach((segment) => {
        const weight = categoryWeights[category] || 1;
        const segData = demographicData[category]?.[segment];
        if (!segData) return;

        totalWeightedScore += scoreLabelToNumber(segData[equipmentType]) * weight;
        totalWeight += weight;

        if (typeof segData.usage === "number") {
          totalUsage += segData.usage * weight;
          totalSelections += weight;
        }
      });
    });

    equipmentScores[equipmentType] = totalWeight > 0 ? (totalWeightedScore / totalWeight) : 4;
  });

  const avgUsage = totalSelections > 0 ? (totalUsage / totalSelections) : 26;

  let activityLevel: "High Activity" | "Moderate Activity" | "Low Activity" = "Moderate Activity";
  if (avgUsage >= 32) activityLevel = "High Activity";
  else if (avgUsage <= 22) activityLevel = "Low Activity";

  const priorities = [...EQUIPMENT_TYPES]
    .map((t) => ({ type: t, score: equipmentScores[t] }))
    .sort((a, b) => b.score - a.score);

  const topPriorities = priorities.slice(0, 3);

  const guidance = buildEquipmentFocusGuidance(equipmentScores, activityLevel, topPriorities);

  return {
    equipmentScores,
    activityLevel,
    avgUsage: round2(avgUsage),
    topPriorities,
    guidance
  };
}

export interface BudgetMultiplierInput {
  demographicAdjustments: DemographicAdjustmentsResult;
  selectedDemographics?: SelectedDemographics;
}

export function calculateBudgetMultiplier(input: BudgetMultiplierInput): number {
  const { demographicAdjustments, selectedDemographics = {} } = input;

  let multiplier = 1.0;

  const connectedScore = demographicAdjustments?.equipmentScores?.Connected ?? 4;
  if (connectedScore >= 5.5) multiplier += 0.15;
  else if (connectedScore >= 4.5) multiplier += 0.05;

  const activityLevel = demographicAdjustments?.activityLevel;
  if (activityLevel === "High Activity") multiplier += 0.12;
  else if (activityLevel === "Low Activity") multiplier -= 0.05;

  const hasHighIncome = (selectedDemographics?.Income || []).includes("High");
  if (hasHighIncome) multiplier += 0.10;

  return clamp(multiplier, 0.8, 1.4);
}

export interface BudgetInput {
  squareFootage: number;
  propertyClass?: PropertyClass;
  classPricing?: Record<PropertyClass, number>;
  selectedDemographics?: SelectedDemographics;
}

export interface BudgetResult {
  ok: boolean;
  error?: string;
  propertyClass?: PropertyClass;
  baseCostPerSF?: number;
  budgetMultiplier?: number;
  costPerSF?: number;
  budget?: number;
  demographicSummary?: DemographicAdjustmentsResult;
}

export function calculateBudget(input: BudgetInput): BudgetResult {
  const {
    squareFootage,
    propertyClass = DEFAULTS.propertyClass,
    classPricing = DEFAULTS.classPricing,
    selectedDemographics = {}
  } = input;

  if (!squareFootage || squareFootage <= 0) {
    return { ok: false, error: "Square footage required for budget calculation." };
  }

  const baseCostPerSF = classPricing[propertyClass] ?? classPricing.B;
  const demo = calculateDemographicAdjustments({ selectedDemographics });
  const multiplier = calculateBudgetMultiplier({ demographicAdjustments: demo, selectedDemographics });
  const costPerSF = baseCostPerSF * multiplier;
  const budget = squareFootage * costPerSF;

  return {
    ok: true,
    propertyClass,
    baseCostPerSF: round2(baseCostPerSF),
    budgetMultiplier: round2(multiplier),
    costPerSF: round2(costPerSF),
    budget: round2(budget),
    demographicSummary: demo
  };
}

export interface AdvancedOverrides {
  adultsPerUnit?: number;
  residentsPercent?: number;
  peakPercent?: number;
  peakDays?: number;
  ibcFactor?: number;
}

export interface ProposalOutputsInput {
  units?: number;
  sfOverride?: number;
  propertyClass?: PropertyClass;
  selectedDemographics?: SelectedDemographics;
  advancedOverrides?: AdvancedOverrides;
}

export interface ProposalOutputs {
  section1_budget: BudgetResult;
  section2_squareFootage: SquareFootageResult;
  section3_equipmentFocus: DemographicAdjustmentsResult;
}

export function generateProposalOutputs(input: ProposalOutputsInput): ProposalOutputs {
  const {
    units,
    sfOverride,
    propertyClass,
    selectedDemographics,
    advancedOverrides = {}
  } = input;

  // Decide SF source
  let sfResult: SquareFootageResult;
  if (sfOverride && sfOverride > 0) {
    sfResult = { ok: true, squareFootage: round2(sfOverride), source: "override" };
  } else if (units && units > 0) {
    sfResult = calculateSquareFootage({ units, ...advancedOverrides });
    sfResult.source = "calculated";
  } else {
    sfResult = { ok: false, error: "Needs Units or SF Override" };
  }

  // Budget section depends on having SF
  let budgetResult: BudgetResult = { ok: false, error: "Needs square footage." };
  if (sfResult.ok && sfResult.squareFootage) {
    budgetResult = calculateBudget({
      squareFootage: sfResult.squareFootage,
      propertyClass: propertyClass || DEFAULTS.propertyClass,
      selectedDemographics: selectedDemographics || {}
    });
  }

  // Equipment focus always available, but better with demographics
  const equipmentFocus = calculateDemographicAdjustments({ selectedDemographics: selectedDemographics || {} });

  return {
    section1_budget: budgetResult,
    section2_squareFootage: sfResult,
    section3_equipmentFocus: equipmentFocus
  };
}

function buildEquipmentFocusGuidance(
  equipmentScores: Record<EquipmentType, number>,
  activityLevel: string,
  topPriorities: EquipmentPriority[]
): string[] {
  const focusLine = topPriorities.map(p => p.type).join(", ");
  const connected = equipmentScores.Connected;
  const bullets: string[] = [];

  bullets.push(`Primary emphasis: ${focusLine}.`);
  bullets.push(`Activity profile: ${activityLevel}.`);

  if (connected >= 5) {
    bullets.push("Strong demand signal for connected fitness experiences and tech-enabled cardio.");
  }
  if (equipmentScores["Free Weights"] >= 5) {
    bullets.push("Expect heavier utilization of free weights and strength zones. Plan clear circulation and durability.");
  }
  if (equipmentScores.Selectorized >= 5) {
    bullets.push("Selectorized strength should be prominent for accessibility and broad appeal.");
  }
  if (equipmentScores.Functional >= 5) {
    bullets.push("Functional training zone should be visible and flexible. Turf or open space increases perceived value.");
  }

  return bullets.slice(0, 6);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}
