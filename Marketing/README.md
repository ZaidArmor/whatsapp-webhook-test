# Marketing — Social Command Center

نظام متكامل لإدارة حسابات التواصل الاجتماعي والحملات الإعلانية — عربي RTL بالكامل مع تبديل فوري إلى الإنجليزية LTR. يعمل حالياً في **وضع المحاكاة (Mock)** ببيانات وهمية واقعية، وكل نقاط الربط الحقيقي جاهزة ومُعلَّمة بـ `// TODO: connect real API here`.

> ⛔ **نقطة التوقف الإلزامية**: لم يتم أي نشر إنتاجي، ولا ربط دومين، ولا إدخال مفاتيح API حقيقية لأي منصة — كل شيء جاهز للربط فقط. راجع `INTEGRATION-GUIDE.md`.

---

## 1) البنية التقنية ولماذا

| المكوّن | الاختيار | السبب |
|---|---|---|
| الإطار | **Next.js 16 (App Router) + TypeScript** | Node بالكامل؛ Backend (Server Actions/API Routes) وFrontend في مشروع واحد، مع SSR ودعم RTL ممتاز |
| قاعدة البيانات | **PostgreSQL + Prisma ORM** | مخطط قوي بعلاقات وفهارس، وDecimal للمبالغ المالية |
| الواجهة | **Tailwind CSS + مكوّنات بنمط shadcn/ui** | سرعة بناء + توحيد الهوية (كحلي Navy + تركوازي مميز) + وضع ليلي عبر next-themes |
| المصادقة | **Auth.js (NextAuth v5) — JWT** | جلسات تحمل العضويات، وحارس صلاحيات على كل مسار وإجراء |
| الرسوم | **Recharts** | تفاعلية وتعمل داخل RTL (حاويات `dir="ltr"`) |
| i18n | **قواميس JSON (ar/en) + مزوّد خاص خفيف** | كل النصوص من `src/messages/ar.json` و`en.json` — لا نصوص مثبتة داخل المكوّنات، والتبديل فوري بملف كوكي |
| الاختبارات | **Vitest** | اختبارات للمنطق الحرج (المقاييس، RBAC، تطابق قواميس الترجمة) |

الخطوط العربية: **Cairo** (العناوين والنصوص) محمّل عبر `next/font`.

## 2) التشغيل محلياً خطوة بخطوة

```bash
cd Marketing

# 1. قاعدة البيانات (PostgreSQL عبر Docker — منفذ 5433)
docker compose up -d

# 2. متغيرات البيئة
cp .env.example .env       # عدّل AUTH_SECRET (openssl rand -base64 32)

# 3. الاعتماديات والمخطط والبيانات التجريبية
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts

# 4. التشغيل
npm run dev                # http://localhost:3000
```

فحوصات الجودة:

```bash
npx tsc --noEmit    # الأنواع
npx next build      # البناء
npx eslint src tests
npx vitest run      # 17 اختباراً
```

### حساب الدخول التجريبي

| البريد | كلمة المرور | الدور |
|---|---|---|
| `admin@marketing.sa` | `Marketing@123` | Owner (كل الصلاحيات) |
| `manager@marketing.sa` | `Marketing@123` | Manager (موافقات + نشر) |
| `editor@marketing.sa` | `Marketing@123` | Editor (إنشاء محتوى) |
| `analyst@marketing.sa` | `Marketing@123` | Analyst (تقارير وتحليلات) |
| `client@marketing.sa` | `Marketing@123` | Viewer (قراءة فقط) |

مساحتا عمل جاهزتان: **أرمور لحماية السيارات** و**مطاعم جورميه** — بدّل بينهما من أعلى الشاشة.

## 3) ما تم إنجازه (كل الوحدات تعمل فعلياً بالبيانات الوهمية)

1. **Auth + RBAC** — 6 أدوار (Owner/Admin/Manager/Editor/Analyst/Viewer) بمصفوفة صلاحيات واحدة (`src/lib/auth/permissions.ts`) تحرس كل صفحة وServer Action.
2. **لوحة التحكم** — 12 مؤشراً موحّداً عبر المنصات + مقارنة فترة بفترة + 6 رسوم + فلاتر (منصة/حساب/حملة/فترة).
3. **الحسابات المتصلة** — ربط/فصل/مزامنة لكل منصة عبر طبقة Adapters (محاكاة كاملة).
4. **المُنشئ والمجدول** — منشور موحّد متعدد المنصات، حدود أحرف لكل منصة، وسائط، معاينة، جدولة، مسودات، **سير موافقات** (إرسال ← اعتماد/رفض بملاحظة)، قائمة انتظار وأفضل أوقات نشر محسوبة من التفاعل، وتقويم شهري.
5. **صندوق الوارد الموحّد** — تعليقات ورسائل من كل المنصات، رد، تعيين، حالات (مفتوح/قيد المعالجة/مغلق).
6. **إدارة الحملات** — حملة ← مجموعة إعلانية ← إعلان، ميزانيات وجماهير، مقارنة ROAS بين المنصات، إنشاء وإيقاف/تفعيل.
7. **CRM** — جهات اتصال بمراحل Pipeline وقيم متوقعة، سجل تفاعلات، وربط بالحملات.
8. **التقارير** — 6 قوالب، تصدير CSV (بترميز عربي سليم) وExcel حقيقي، طباعة/PDF، وجدولة شهرية.
9. **محرك التحليلات** — 7 قواعد تُنتج توصيات وتنبيهات (ROAS سالب، CTR منخفض، فرصة توسّع، ارتفاع CPC، هبوط تفاعل، أفضل منشور، أفضل وقت نشر) بحالات معالجة.
10. **الفريق ومساحات العمل** — multi-tenant، إنشاء مساحات، إضافة/إزالة أعضاء بأدوار.
11. **الإعدادات** — ملف شخصي، لغة، وضع ليلي، إشعارات، وحقول مفاتيح API (غير مفعّلة).
12. **الأمان** — تحقق Zod في كل Action، حراسة صلاحيات، **سجل تدقيق** كامل، حذف ناعم (soft delete).

## 4) سجل الالتزامات حسب المراحل

| المرحلة | الالتزام |
|---|---|
| 1 — التهيئة | `Marketing M1: scaffold Social Command Center (i18n RTL/LTR, theme, Prisma, Docker)` |
| 2 — المصادقة والصلاحيات | `Marketing M2: auth + workspace RBAC + RTL app shell` |
| 3 — لوحة التحكم | `Marketing M3: unified dashboard with KPIs, charts and filters` |
| 4 — طبقة Adapters | `Marketing M4: platform adapters, mock content/inbox/CRM seed, connections page` |
| 5 — المُنشئ والمجدول | `Marketing M5: composer, scheduler, calendar, approvals workflow` |
| 6 — صندوق الوارد | `Marketing M6: unified inbox` |
| 7 — الحملات | `Marketing M7: cross-platform ads manager` |
| 8 — CRM | `Marketing M8: CRM contacts, pipeline, activity log` |
| 9 — التقارير والتحليلات | `Marketing M9: reports engine + rules-based insights engine` |
| 10 — الفريق والإعدادات والتلميع | `Marketing M10: team workspaces, settings, audit log, tests, docs` |

## 5) ما يحتاج ربطاً حقيقياً (لكل منصة)

الطبقة الموحّدة في `src/lib/integrations/` — واجهة `SocialPlatformAdapter` واحدة، و`MockSocialAdapter` يعمل على قاعدة البيانات المحلية، وكل مزوّد يرث منه. للربط: نفّذ override للدوال داخل ملف المنصة مكان تعليقات `// TODO: connect real API here`، واملأ المتغيرات في `.env`.

| المنصة | الملف | المتغيرات المطلوبة | التوثيق |
|---|---|---|---|
| Meta (Facebook + Instagram + Ads) | `providers/meta.ts` | `META_APP_ID`, `META_APP_SECRET`, `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID` | <https://developers.facebook.com/docs/graph-api> · <https://developers.facebook.com/docs/marketing-apis> |
| TikTok (+ Ads) | `providers/tiktok.ts` | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_ADS_ACCESS_TOKEN`, `TIKTOK_ADS_ADVERTISER_ID` | <https://developers.tiktok.com> · <https://business-api.tiktok.com/portal/docs> |
| Snapchat (+ Ads) | `providers/snapchat.ts` | `SNAPCHAT_CLIENT_ID`, `SNAPCHAT_CLIENT_SECRET`, `SNAPCHAT_AD_ACCOUNT_ID` | <https://developers.snap.com/api/marketing-api/Ads-API/introduction> |
| X (Twitter) | `providers/x.ts` | `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET` | <https://developer.x.com/en/docs/x-api> |
| LinkedIn | `providers/linkedin.ts` | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_ORGANIZATION_ID` | <https://learn.microsoft.com/en-us/linkedin/marketing/> |
| Google Ads | `providers/google-ads.ts` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID` | <https://developers.google.com/google-ads/api/docs/start> |
| YouTube | `providers/youtube.ts` | `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` | <https://developers.google.com/youtube/v3> |

كما يوجد TODO للربط الحقيقي في: إيقاف/تفعيل الحملات (`src/app/(app)/ads/actions.ts`) وجدولة التقارير الفعلية عبر cron (`src/app/(app)/reports/actions.ts`).

## 6) بنية المجلدات المختصرة

```
Marketing/
├─ prisma/            # المخطط + الهجرات + seed (بيانات وهمية واقعية)
├─ src/
│  ├─ app/            # الصفحات (App Router) + Server Actions + API
│  ├─ components/     # مكوّنات UI لكل وحدة + ui primitives
│  ├─ lib/
│  │  ├─ auth/        # Auth.js + RBAC + سياق مساحة العمل
│  │  ├─ data/        # طبقة الاستعلامات (dashboard/posts/inbox/ads/crm)
│  │  ├─ integrations/# الواجهة الموحّدة + Mock + مزوّد لكل منصة
│  │  ├─ insights/    # محرك القواعد التحليلية
│  │  ├─ reports/     # مولّد قوالب التقارير
│  │  └─ i18n/        # القواميس والمزوّد
│  └─ messages/       # ar.json / en.json (كل نصوص الواجهة)
├─ tests/             # Vitest (metrics / RBAC / i18n)
├─ docker-compose.yml # PostgreSQL محلي (منفذ 5433)
└─ .env.example       # كل المتغيرات موثّقة بالتعليقات
```
