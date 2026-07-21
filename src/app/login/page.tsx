import type { Metadata } from "next";
import { ShieldCheck, TrendingUp, Users2 } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "تسجيل الدخول — ARMOR",
};

const highlights = [
  { icon: TrendingUp, text: "لوحة تحكم مركزية لأداء جميع الحملات الإعلانية" },
  { icon: Users2, text: "إدارة عملاء وشرائح إعادة استهداف دقيقة" },
  { icon: ShieldCheck, text: "حماية بيانات وصلاحيات متعددة المستويات" },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy p-12 text-white lg:flex">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative z-10">
          <div className="text-2xl font-bold">ARMOR</div>
          <div className="mt-1 text-sm text-white/70">مركز الذكاء التسويقي</div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-3xl font-bold leading-tight">
            كل بياناتك التسويقية والعملاء
            <br /> في مكان واحد
          </h1>
          <ul className="space-y-4">
            {highlights.map((item) => (
              <li key={item.text} className="flex items-center gap-3 text-white/90">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className="h-4.5 w-4.5" />
                </span>
                <span className="text-sm">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-xs text-white/50">
          © {new Date().getFullYear()} ARMOR Marketing Intelligence Hub
        </div>
      </div>

      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-start">
            <div className="mb-4 text-2xl font-bold text-primary lg:hidden">ARMOR</div>
            <h2 className="text-xl font-semibold">تسجيل الدخول إلى حسابك</h2>
            <p className="text-sm text-muted-foreground">
              أدخل بيانات الدخول للوصول إلى لوحة التحكم
            </p>
          </div>

          <LoginForm />

          <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            حساب تجريبي: <span className="font-medium">admin@armor.sa</span> / كلمة المرور:{" "}
            <span className="font-medium">Armor@12345</span>
          </p>
        </div>
      </div>
    </div>
  );
}
