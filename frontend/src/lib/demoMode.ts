/** Demonstration mode shows widgets built on values the dataset cannot support
 * (beds, staff, departments, ...). It is off unless explicitly enabled, so
 * nothing invented is visible by default. NEXT_PUBLIC_ so client components see it. */
export function isDemoModeEnabled(value: string | undefined = process.env.NEXT_PUBLIC_MEDORCH_DEMO_MODE): boolean {
  return value?.trim().toLowerCase() === 'true';
}
