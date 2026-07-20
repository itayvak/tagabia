export type SplashQuote = {
  text: string;
  author: string;
};

export const SPLASH_QUOTES: readonly SplashQuote[] = [
  { text: "להיות אדם טוב ולהשתפר כל הזמן", author: 'ארז אורבך ז"ל' },
];

function getDayOfYear(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diffMs = date.getTime() - startOfYear.getTime();
  const dayMs = 1000 * 60 * 60 * 24;
  return Math.floor(diffMs / dayMs);
}

export function getDailySplashQuote(date: Date = new Date()): SplashQuote {
  const index = getDayOfYear(date) % SPLASH_QUOTES.length;
  return SPLASH_QUOTES[index];
}
