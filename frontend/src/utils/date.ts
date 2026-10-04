export const todayStr = (): string => new Date().toISOString().slice(0, 10);

export const addDaysStr = (days: number): string => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
