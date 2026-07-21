import type { Metadata } from "next";
import { Tajawal, Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { dir, locales, type Locale } from "@/lib/i18n/dictionaries";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-arabic",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ARMOR — مركز الذكاء التسويقي",
  description:
    "منصة مركزية لإدارة وتحليل حسابات التواصل الاجتماعي والحملات الإعلانية والعملاء",
};

function resolveLocale(value: string | undefined): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : "ar";
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get("armor_locale")?.value);

  return (
    <html lang={locale} dir={dir(locale)} suppressHydrationWarning>
      <body className={`${tajawal.variable} ${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
