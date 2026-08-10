export const PROBATION_DAYS = 30;
export const PROBATION_MAX_PRICE_PER_HOUR = 600;
export const PROBATION_MAX_PRICE_PER_MINUTE = Number((PROBATION_MAX_PRICE_PER_HOUR / 60).toFixed(2));

export function getProbationEndDate(fromDate = new Date()) {
  const end = new Date(fromDate);
  end.setDate(end.getDate() + PROBATION_DAYS);
  return end;
}

export function isInProbation(astrologerProfile) {
  if (!astrologerProfile?.probationEndsAt) return false;
  return new Date() < new Date(astrologerProfile.probationEndsAt);
}
