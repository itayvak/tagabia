export type SplashQuote = {
  text: string;
  author: string;
};

export const SPLASH_QUOTES: readonly SplashQuote[] = [
  { text: "להיות אדם טוב ולהשתפר כל הזמן", author: 'ארז אורבך ז"ל' },
  {
    text: "בכל משבר או אתגר בחיים שלי, אוהב לצאת למדבר, לחווארים, ליד הבית, ופשוט להתמודד כשזה רק אני והמדבר עם האמת האישית שלי בלי שום מסכות",
    author: 'אהד כהן ז"ל',
  },
  { text: "הסתכלתם על השמיים היום?", author: 'אביאל מלקמו ז"ל' },
  { text: "כל אדם מת- לא כל אדם באמת חי", author: 'סמר רועי וולף ז"ל' },
  { text: "שמעתי. צודק, אשפר", author: 'איתן פיש ז"ל' },
  {
    text: "אדם אינו נמדד במכלול הפחדים והכשלונות שלו, אלא ביכולתו להתמודד איתם.",
    author: 'סרן איתן אוסטר ז"ל',
  },
  {
    text: "האומץ נובע מזה שאדם חיי את חיי הכלל",
    author: 'הלל עובדיה ז"ל',
  },
  { text: "להיות איש של רוח בעולם המעשה", author: 'הלל עובדיה ז"ל' },
  { text: "לחייך אל הקושי", author: 'סמל רועי פרי ז"ל' },
  {
    text: "עשיתי אתמול מה שלא עשית, כדי שאוכל לעשות היום מה שאתה לא יכול",
    author: 'עידו ברויר ז"ל',
  },
  {
    text: "אם צריך לתת, אני אתן. בסוף זה האופי שלי",
    author: 'ליאם בן חמו ז"ל',
  },
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
