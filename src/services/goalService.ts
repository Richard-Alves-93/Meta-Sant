import { isLastDayOfMonth, isFirstDayOfMonth } from '@/utils/date';

const LAST_GOAL_CHECK_KEY = 'last_goal_check_date';

export function getLastCheck(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem(LAST_GOAL_CHECK_KEY) : null;
}

export function setLastCheck() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_GOAL_CHECK_KEY, new Date().toDateString());
}

interface ShouldAskNextMonthGoalsParams {
  currentDate: Date;
  hasNextMonthGoals: boolean;
  lastCheckDate: string | null;
}

interface ShouldForceGoalSetupParams {
  currentDate: Date;
  hasCurrentMonthGoals: boolean;
}

export function shouldAskNextMonthGoals({
  currentDate,
  hasNextMonthGoals,
  lastCheckDate,
}: ShouldAskNextMonthGoalsParams) {
  const today = currentDate.toDateString();
  if (lastCheckDate === today) return false;
  return isLastDayOfMonth(currentDate) && !hasNextMonthGoals;
}

export function shouldForceGoalSetup({
  currentDate,
  hasCurrentMonthGoals,
}: ShouldForceGoalSetupParams) {
  return isFirstDayOfMonth(currentDate) && !hasCurrentMonthGoals;
}
