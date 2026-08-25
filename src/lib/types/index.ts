export type {
  TaxonomyCategory,
  TagRef,
  TagLevel,
  Proximity,
  TaxonomyTerm,
} from './taxonomy';
export { isSameTag, nextTagLevel, tagId } from './taxonomy';

export type {
  StayType,
  CompanionType,
  RequiredConditions,
  WishConditions,
  SearchConditions,
  Origin,
  SavedCondition,
} from './conditions';
export { EMPTY_CONDITIONS } from './conditions';

export type {
  DayHours,
  BusinessHours,
  SaunaImage,
  Cooldown,
  SaunaEnvironment,
  SaunaSummary,
  SaunaDetail,
} from './sauna';

export type {
  Weights,
  WeightKey,
  ScoreBreakdown,
  SearchResultItem,
  RelaxSuggestion,
  SearchOutcome,
} from './search';

export type {
  SpotCategory,
  LodgingType,
  RecommendedTiming,
  Restaurant,
  Spot,
  Hotel,
  LinkInfo,
  LinkedRestaurant,
  LinkedSpot,
  LinkedHotel,
  LinkedPlaces,
} from './linked';

export type {
  PlanRefType,
  PlanItem,
  HolidayPlan,
  PlanOutput,
  ResolvedPlanItem,
  ResolvedPlan,
} from './plan';
