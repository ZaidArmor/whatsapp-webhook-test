export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number, decimals = 2): number {
  const value = Math.random() * (max - min) + min;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function randomChoice<T>(items: readonly T[]): T {
  const item = items[randomInt(0, items.length - 1)];
  if (item === undefined) throw new Error("randomChoice called with an empty array");
  return item;
}

export function weightedChoice<T>(pairs: ReadonlyArray<readonly [T, number]>): T {
  const total = pairs.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of pairs) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  const last = pairs[pairs.length - 1];
  if (!last) throw new Error("weightedChoice called with an empty array");
  return last[0];
}

export function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function randomDateBetween(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  return new Date(startTime + Math.random() * (endTime - startTime));
}
