# ARMOR Marketing Intelligence Hub

منصة ويب مركزية لإدارة وتحليل حسابات التواصل الاجتماعي، الحملات الإعلانية،
والعملاء — مصممة لشركة متخصصة في حماية وعناية السيارات (PPF، عازل حراري،
نانو سيراميك، تلميع احترافي، عازل حراري للمباني).

الواجهة الأساسية باللغة العربية باتجاه RTL كامل، مع إمكانية التبديل إلى
الإنجليزية (LTR) من أيقونة اللغة في الشريط العلوي.

> هذا المستند يوثّق نسخة الـ MVP الحالية. راجع قسم **"الأجزاء الجاهزة مقابل
> الأجزاء التي تحتاج بيانات اعتماد حقيقية"** أدناه لمعرفة ما يعمل فعلياً وما
> هو محاكاة (Mock) في انتظار ربط حقيقي.

---

## المكدس التقني

| الطبقة | التقنية |
|---|---|
| إطار العمل | Next.js 16 (App Router, Server Actions, Turbopack) |
| اللغة | TypeScript (strict mode) |
| الواجهة | React 19، Tailwind CSS، مكونات مبنية بنمط shadcn/ui فوق Radix UI |
| الرسوم البيانية | Recharts |
| قاعدة البيانات | PostgreSQL 16 |
| ORM | Prisma |
| المصادقة | Auth.js (NextAuth) v5 — Credentials Provider + JWT |
| النماذج والتحقق | React Hook Form + Zod (في نماذج الخادم) |
| استيراد/تصدير الملفات | SheetJS (xlsx) للقراءة والكتابة، Papaparse متاح لتحليل CSV |
| الاختبارات | Vitest |
| الحاويات | Docker Compose (لقاعدة البيانات) |

---

## التشغيل المحلي

### المتطلبات

- Node.js ≥ 20
- Docker و Docker Compose (لتشغيل PostgreSQL) — أو أي خادم PostgreSQL 16 محلي
- npm

### الخطوات

```bash
# 1) تثبيت الحزم
npm install

# 2) نسخ متغيرات البيئة وتعديلها عند الحاجة
cp .env.example .env

# 3) تشغيل قاعدة البيانات
docker compose up -d

# 4) تطبيق الـ migrations وإنشاء الجداول
npm run db:migrate

# 5) تعبئة بيانات تجريبية واقعية (فروع، خدمات، حملات، عملاء، تحليلات...)
npm run db:seed

# 6) تشغيل المشروع
npm run dev
```

افتح `http://localhost:3000` — سيتم توجيهك تلقائياً إلى صفحة تسجيل الدخول.

### حساب الدخول التجريبي

| البريد الإلكتروني | كلمة المرور | الدور |
|---|---|---|
| `admin@armor.sa` | `Armor@12345` | مدير النظام (Super Admin — كل الصلاحيات) |

### أوامر مفيدة أخرى

```bash
npm run db:studio     # فتح Prisma Studio لتصفح البيانات
npm run db:generate   # إعادة توليد Prisma Client بعد تعديل الـ schema
npm run typecheck     # فحص TypeScript بدون بناء
npm run test          # تشغيل الاختبارات (Vitest)
npm run build         # بناء نسخة الإنتاج
```

### تشغيل الـ Migrations لاحقاً

بعد أي تعديل على `prisma/schema.prisma`:

```bash
npm run db:migrate      # ينشئ migration جديدة محلياً ويطبّقها
# أو في بيئة الإنتاج:
npm run db:deploy       # يطبّق الـ migrations الموجودة فقط، دون توليد جديدة
```

---

## بنية المشروع

```
prisma/
  schema.prisma        # مخطط قاعدة البيانات الكامل (31 نموذج)
  seed.ts              # نقطة دخول التعبئة بالبيانات التجريبية
  seed/                # وحدات التعبئة (خدمات، حملات، تفصيل الأداء، عملاء...)

src/
  app/
    login/                      # صفحة تسجيل الدخول (خارج المجموعة المحمية)
    (app)/                      # كل الصفحات المحمية بجلسة دخول
      dashboard/
      campaigns/, campaigns/[id]/
      customers/, customers/[id]/, customers/import/, customers/duplicates/
      segments/, segments/new/, segments/[id]/
      exports/
      recommendations/
      alerts/
      integrations/
      reports/
      branches/, services/, users/, settings/, audit-log/
    api/auth/[...nextauth]/     # مسار Auth.js

  components/
    ui/            # مكونات أساسية بنمط shadcn (Button، Card، Dialog...)
    layout/        # Sidebar، Header، Breadcrumbs، Command Search...
    shared/        # KpiCard، ChartCard، DataTable، FilterBar، حالات فارغة/خطأ...
    dashboard/، campaigns/، customers/، segments/، exports/،
    recommendations/، alerts/، integrations/، import/، branches/،
    services/، users/، audit/، reports/    # مكونات خاصة بكل قسم

  lib/
    auth/          # إعداد Auth.js، الصلاحيات (RBAC)، الإجراءات
    prisma.ts      # عميل Prisma (Singleton)
    data/          # طبقة الاستعلامات (Server-only) لكل قسم
    analytics/     # معادلات التسويق (CTR, CPL, ROAS...) — src/lib/analytics/formulas.ts
    analysis/      # محرك القواعد التحليلية + العتبات القابلة للتعديل
    phone/         # محرك تطبيع أرقام الجوال السعودية + إخفاء الأرقام
    import/        # قراءة وتنظيف واكتشاف تكرار ملفات الاستيراد
    export/        # بناء ملفات CSV/XLSX ومحولات صيغ المنصات الإعلانية
    segments/      # محرك تقييم شروط الشرائح (AND/OR متداخلة)
    integrations/  # واجهة MarketingIntegrationProvider + المزودون الوهميون
    audit/         # تسجيل الأحداث في AuditLog
    constants/، i18n/، chart-colors.ts

  types/           # أنواع مشتركة عبر الواجهة

tests/             # اختبارات Vitest (وحدة وتكامل)
docker-compose.yml
.env.example
```

### مبدأ الفصل بين الطبقات

- **`src/lib/data/*`**: طبقة استعلام واحدة لكل قسم (Server-only)، تُستدعى من مكوّنات الخادم (Server Components) في `page.tsx`.
- **`src/app/**/actions.ts`**: كل الكتابة على قاعدة البيانات تمر عبر Server Actions، تتحقق من الصلاحيات أولاً (`requirePermission`)، ثم تُطبّق `zod` على المدخلات، ثم تُسجّل في `AuditLog` عند الحاجة.
- **المكونات التفاعلية** (`"use client"`) لا تتحدث مع قاعدة البيانات مباشرة؛ تستدعي فقط الـ Server Actions.

---

## إضافة منصة إعلانية جديدة

بنية التكاملات مبنية على نمط Adapter (`src/lib/integrations/`):

1. أضف قيمة جديدة إلى `enum Platform` في `prisma/schema.prisma` إذا لم تكن موجودة، ثم شغّل migration.
2. أنشئ ملف مزوّد جديد في `src/lib/integrations/providers/your-platform-provider.ts` يطبّق واجهة `MarketingIntegrationProvider` (الموجودة في `src/lib/integrations/types.ts`):
   ```ts
   export interface MarketingIntegrationProvider {
     connect(): Promise<ConnectResult>;
     disconnect(): Promise<void>;
     refreshToken(): Promise<ConnectResult>;
     testConnection(): Promise<ConnectionStatusResult>;
     getConnectionStatus(): Promise<ConnectionStatusResult>;
     syncAccounts(): Promise<SyncResult>;
     syncCampaigns(): Promise<SyncResult>;
     syncAds(): Promise<SyncResult>;
     syncMetrics(): Promise<SyncResult>;
   }
   ```
   في وضع المحاكاة الحالي، كل الملفات في `providers/` هي بدائل رقيقة (thin subclasses) لـ `MockIntegrationProvider`.
3. سجّل المنصة الجديدة في `src/lib/integrations/registry.ts` (دالة `getProvider`) وأضفها إلى `ALL_INTEGRATION_PLATFORMS`.
4. أضف شارة المنصة (لون/اسم) في `src/components/shared/platform-badge.tsx`.

لا حاجة لتعديل أي شيء في صفحة `/integrations` أو الإجراءات (`actions.ts`) — كلها تعمل عبر الواجهة الموحدة.

---

## استبدال الـ Mock APIs بواجهات حقيقية

النظام مصمم بحيث يكون الانتقال من البيانات الوهمية إلى API حقيقي تغييراً
محصوراً في طبقة واحدة:

1. **التكاملات الإعلانية**: أنشئ صنفاً جديداً (مثلاً `RealMetaProvider`) يطبّق
   `MarketingIntegrationProvider` باستخدام عميل API حقيقي (Graph API لـ Meta،
   Google Ads API، إلخ)، واقرأ المفاتيح من متغيرات البيئة
   (`META_APP_ID`, `META_APP_SECRET`, `META_ACCESS_TOKEN`, ...) الموجودة في
   `.env.example` — **لا تضعها أبداً مباشرة في الكود**. بدّل السطر المطابق في
   `registry.ts` من `new MetaProvider(...)` إلى `new RealMetaProvider(...)`
   عندما يكون `INTEGRATIONS_USE_MOCK=false`.
2. **تخزين الملفات (الاستيراد/التصدير)**: حالياً يتم تحليل ملفات الاستيراد في
   المتصفح مباشرة (SheeJS) دون رفعها لخادم تخزين، والتصدير يُنزَّل مباشرة من
   المتصفح. لبيئة إنتاج حقيقية تحتاج أرشفة الملفات، أضف رفعاً إلى تخزين كائنات
   (S3-compatible) وحدّث `ImportJob.errorFileUrl` / `ExportJob.fileUrl` بالرابط
   الفعلي بدل توليد الملف عند الطلب فقط.
3. **جدولة محرك التحليل**: زر "تشغيل التحليل الآن" في `/recommendations` يستدعي
   `runAnalysisEngine()` يدوياً. في الإنتاج، استبدله بمهمة مجدولة (cron job أو
   queue worker) تستدعي نفس الدالة (`src/lib/analysis/engine.ts`) دورياً.

---

## معايير حماية البيانات المطبّقة

- **إخفاء أرقام الجوال**: يتم إخفاء الجزء الأوسط من رقم الجوال لأي مستخدم
  لا يملك دوراً ضمن `FULL_PHONE_VISIBILITY_ROLES`
  (`src/lib/phone/mask.ts`) — مدير النظام والمدير التنفيذي ومدير التسويق
  ومدير المبيعات فقط يرون الرقم كاملاً.
- **RBAC حقيقي**: 9 أدوار × 13 صلاحية، تُطبَّق في كل Server Action عبر
  `requirePermission(...)` قبل أي قراءة أو كتابة حساسة — وليست شكلية في
  الواجهة فقط.
- **Soft Delete**: حذف العملاء والفروع والخدمات لا يمسح السجل فعلياً؛ يضع
  `deletedAt` ويُستثنى تلقائياً من كل الاستعلامات.
- **Audit Log**: كل عملية إنشاء/تعديل/حذف/تصدير/استيراد/دمج عملاء/ربط أو
  فك ربط تكامل تُسجَّل في جدول `AuditLog` (المستخدم، الإجراء، نوع الكائن،
  معرّفه، بيانات وصفية JSON) — لا تُسجَّل قيم حساسة خام (مثل رقم الجوال
  الكامل) داخل بيانات التدقيق.
- **موافقة تسويقية**: حقل `marketingConsent` على كل عميل، قابل للتبديل من
  صفحة تفاصيل العميل، ويمكن استخدامه كشرط ضمن الشرائح لاستبعاد من رفض
  الرسائل التسويقية عند التصدير.
- **التحقق من المدخلات**: كل Server Action يمرّر مدخلاته عبر مخطط `zod` قبل
  لمس قاعدة البيانات.
- **لا مفاتيح API في الكود**: جميع مفاتيح التكاملات تُقرأ من متغيرات البيئة
  فقط (`.env.example` موثّق بكل المتغيرات المطلوبة)، ولا تظهر أبداً في
  الواجهة.
- **عدم حذف البيانات الأصلية عند التطبيع**: محرك تطبيع الجوال يحتفظ دائماً
  بـ `originalPhone` الأصلي إلى جانب `normalizedPhone` المطبَّع.

### فجوات معروفة (تحتاج عملاً إضافياً قبل الإنتاج الفعلي)

- لا يوجد Rate Limiting فعلي مطبّق على مستوى الشبكة/الوسيط (middleware) لعمليات
  التصدير والاستيراد الحساسة — القيم في `.env.example`
  (`RATE_LIMIT_EXPORT_PER_HOUR`, `RATE_LIMIT_IMPORT_PER_HOUR`) توثيقية فقط
  حالياً وتحتاج تطبيقاً عبر مخزن حالة (Redis أو ما شابه).
- تشفير الحقول الحساسة على مستوى قاعدة البيانات (`FIELD_ENCRYPTION_KEY`) موثّق
  في `.env.example` لكن غير مُفعَّل فعلياً على أعمدة Prisma في هذه النسخة.

---

## الاختبارات

```bash
npm run test        # تشغيل كل الاختبارات مرة واحدة
npm run test:watch  # وضع المراقبة أثناء التطوير
```

الاختبارات الحالية (60 اختباراً عبر 5 ملفات):

| الملف | يغطي |
|---|---|
| `tests/phone-normalize.test.ts` | محرك تطبيع أرقام الجوال السعودية — كل الصيغ المذكورة في المواصفات (٠٥، ٩٦٦، +٩٦٦، ٠٠٩٦٦، أرقام عربية، رقم ثابت، رقم دولي...) |
| `tests/formulas.test.ts` | كل معادلات التسويق (CTR/CPC/CPM/CPL/CAC/ROAS/...) بما فيها القسمة الآمنة على صفر ومقارنة الفترات |
| `tests/segment-evaluate.test.ts` | محرك تقييم شروط الشرائح، بما فيها سيناريو مجموعات AND/OR متداخلة |
| `tests/analysis-rules.test.ts` | كل قاعدة من قواعد محرك التحليل (11 قاعدة على مستوى الحملة + قاعدتان على مستوى الفرع/المنصة) |
| `tests/import-integration.test.ts` | اختبار تكامل لعملية الاستيراد الكاملة: قراءة CSV/XLSX ← تعيين الأعمدة ← التنظيف ← اكتشاف التكرار |

---

## الأجزاء الجاهزة مقابل الأجزاء التي تحتاج بيانات اعتماد حقيقية

### ✅ جاهز ويعمل فعلياً (تم اختباره تفاعلياً عبر متصفح حقيقي)

- تسجيل الدخول، الصلاحيات (RBAC)، دعم RTL/LTR والوضع الليلي
- لوحة التحكم بكل مؤشراتها الـ16 والرسوم البيانية العشرة والفلاتر
- جدول الحملات المتقدم وصفحة تفاصيل الحملة (تحليل حسب الجهاز/المنطقة/العمر
  والجنس/الساعة، أفضل إعلان/يوم/ساعة)
- CRM العملاء الكامل (قائمة، تفاصيل، حالة، وسوم، ملاحظات، سجل إجراءات)
- معالج الاستيراد بكامل خطواته الثمانية + اكتشاف التكرار وأداة الدمج
- منشئ الشرائح بشروط AND/OR متداخلة حقيقية + معاينة حية لعدد العملاء
- التصدير بصيغ متعددة (CSV/Excel + قوالب Meta/Google/TikTok/Snapchat/WhatsApp)
- محرك التحليل القائم على القواعد + التوصيات + التنبيهات
- سجل التدقيق الكامل
- إدارة الفروع والخدمات والمستخدمين والأدوار
- مركز التقارير (11 نوع تقرير) مع تصدير وطباعة

### 🧪 محاكاة (Mock) بنية جاهزة لاستبدالها لاحقاً

- **كل التكاملات الإعلانية** (`/integrations`): تعمل بمزودين وهميين يحاكون
  الاتصال والمزامنة والأخطاء العشوائية، لكن لا يوجد اتصال فعلي بأي API خارجي.
  لتفعيلها فعلياً تحتاج: حسابات مطوّرين حقيقية لدى Meta/Google/TikTok/
  Snapchat، ومفاتيح API فعلية في `.env`، وتطبيق الأصناف الحقيقية كما هو موضّح
  أعلاه.
- **تخزين ملفات الاستيراد/التصدير**: لا يوجد رفع فعلي لخدمة تخزين سحابي؛
  المعالجة تتم بالكامل في المتصفح/الخادم عند الطلب.
- **جدولة محرك التحليل**: تشغيل يدوي فقط عبر زر في الواجهة، وليس عبر Cron.

---

## البيانات التجريبية (Seed)

`npm run db:seed` (اقرأ `prisma/seed.ts` و `prisma/seed/*`) ينشئ:

- 13 صلاحية، 9 أدوار مع تعيين الصلاحيات، مستخدم مدير نظام تجريبي
- 3 فروع (أبها، خميس مشيط، جازان) — يمكن إضافة فروع أخرى من `/branches`
- 5 خدمات (PPF، عازل حراري سيارات، نانو سيراميك، تلميع احترافي، عازل حراري مباني)
- 15 حملة (كل تركيبة فرع × خدمة) بمجموعات وإعلانات وبيانات أداء يومية على
  مدى 30–90 يوماً، مع تنويع "جودة أداء" متعمَّد (ممتاز/جيد/متوسط/ضعيف) حتى
  تظهر توصيات وتنبيهات حقيقية عند تشغيل محرك التحليل
- تفصيل أداء حسب الجهاز/المنطقة/العمر والجنس/الساعة لآخر 14 يوماً لكل حملة
- بيانات أداء على مستوى الإعلان الفردي
- 520 عميلاً (بينهم 20 سجلاً مكرراً متعمَّداً) بأرقام جوال سعودية بصيغ فوضوية
  واقعية (بعضها صحيح وبعضها غير صحيح عمداً)، مع Leads وHجوزات ومبيعات مشتقة
  من حالة كل عميل
- ربط 4 منصات إعلانية تجريبياً (Meta، Google، Snapchat، TikTok Ads)
- تشغيل فعلي لمحرك التحليل في نهاية عملية التعبئة، فينتج توصيات وتنبيهات
  حقيقية وليست بيانات وهمية مكتوبة يدوياً

السكربت **idempotent** جزئياً: يعيد فحص الصلاحيات/الأدوار/الفروع في كل مرة
(upsert)، لكنه يتخطى إعادة إنشاء الحملات/العملاء إذا وُجدت بيانات مسبقاً.

---

## ملاحظات إضافية

- جميع الأسعار بالريال السعودي (SAR)، والتواريخ بتقويم ميلادي وبتوقيت
  `Asia/Riyadh` (تم تثبيت هذا صراحة لتفادي عرض التقويم الهجري الذي تستخدمه
  بعض المتصفحات افتراضياً مع لغة `ar-SA`).
- الرسوم البيانية (Recharts) تُعرض دائماً باتجاه LTR داخلياً حتى في وضع RTL —
  هذا مقصود ومطابق لمعظم لوحات SaaS الاحترافية؛ محاولة عرضها بـ RTL كاملاً
  تكسر محاذاة تسميات المحاور في Recharts.
- الملف الأصلي لهذا المستودع (Express webhook بسيط لـ WhatsApp Cloud API)
  محفوظ في `legacy-whatsapp-webhook/` للرجوع إليه، وليس جزءاً من هذا النظام.
