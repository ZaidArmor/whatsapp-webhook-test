# دليل الربط الحقيقي — INTEGRATION GUIDE

هذا الدليل يشرح، لكل منصة، كيف تنشئ التطبيق وتحصل على المفاتيح وأين تضعها في الكود. النظام يعمل حالياً في وضع المحاكاة (`INTEGRATIONS_USE_MOCK=true`) ولا يتصل بأي منصة حقيقية.

## كيف تعمل الطبقة الموحّدة

- **الواجهة**: `src/lib/integrations/types.ts` — كل مزوّد ينفّذ `SocialPlatformAdapter` (connect / disconnect / getConnectionStatus / publishPost / schedulePost / fetchInsights / fetchComments / sendMessage / getAdCampaigns / createAdCampaign).
- **المحاكاة**: `src/lib/integrations/mock-adapter.ts` — يعمل على قاعدة البيانات المحلية، وكل دالة معلّمة بـ `// TODO: connect real API here`.
- **المزوّدون**: `src/lib/integrations/providers/*.ts` — صنف لكل منصة يرث `MockSocialAdapter`. **للربط الحقيقي: أضف override للدوال داخل ملف المنصة فقط** — لا حاجة لأي تغيير في الواجهات أو الصفحات أو طبقة البيانات.
- **الاختيار**: `src/lib/integrations/registry.ts` — دالة `getAdapter(platform)`.

### الخطوات العامة لأي منصة

1. أنشئ التطبيق في بوابة مطوّري المنصة واحصل على المفاتيح.
2. الصق القيم في `Marketing/.env` (الأسماء جاهزة في `.env.example`).
3. نفّذ الدوال الحقيقية داخل ملف المزوّد مكان تعليقات TODO.
4. عيّن `INTEGRATIONS_USE_MOCK=false`.
5. جرّب من شاشة **الحسابات المتصلة**: ربط ← مزامنة ← نشر منشور تجريبي.

---

## Meta — Facebook + Instagram + Meta Ads

**الملف**: `src/lib/integrations/providers/meta.ts`

1. أنشئ تطبيقاً من <https://developers.facebook.com/apps> (نوع Business).
2. أضف منتجات: **Facebook Login for Business**, **Instagram Graph API**, **Marketing API**.
3. الأذونات (Scopes) المطلوبة: `pages_manage_posts`, `pages_read_engagement`, `pages_messaging`, `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments`, `instagram_manage_messages`, `ads_management`, `ads_read`, `business_management`.
4. احصل على Access Token طويل الأمد (60 يوماً) عبر Graph API Explorer ثم بدّله بـ System User Token دائم من Business Manager.
5. المتغيرات: `META_APP_ID`, `META_APP_SECRET`, `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID` (بصيغة `act_XXXXXXXXX`).
6. نقاط مفيدة: النشر `POST /{page-id}/feed` و`POST /{ig-user-id}/media` + `media_publish`؛ الرؤى `GET /{id}/insights`؛ الحملات `POST /act_{ad_account_id}/campaigns`.

## TikTok + TikTok Ads

**الملف**: `src/lib/integrations/providers/tiktok.ts`

1. للنشر والمحتوى: سجّل تطبيقاً في <https://developers.tiktok.com> وفعّل **Content Posting API** (يتطلب مراجعة/اعتماد).
2. الأذونات: `user.info.basic`, `video.publish`, `video.list`, `comment.list`, `comment.reply`.
3. للإعلانات: أنشئ تطبيق Marketing API من <https://business-api.tiktok.com/portal> واربط حساب المعلن.
4. المتغيرات: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_ADS_ACCESS_TOKEN`, `TIKTOK_ADS_ADVERTISER_ID`.

## Snapchat + Snapchat Ads

**الملف**: `src/lib/integrations/providers/snapchat.ts`

1. أنشئ Business Account ثم تطبيق OAuth من <https://business.snapchat.com> (قسم Business Details → OAuth Apps).
2. الأذونات: `snapchat-marketing-api`, `snapchat-profile-api` (للمحتوى العام Public Profiles).
3. المتغيرات: `SNAPCHAT_CLIENT_ID`, `SNAPCHAT_CLIENT_SECRET`, `SNAPCHAT_AD_ACCOUNT_ID`.
4. التوثيق: <https://developers.snap.com/api/marketing-api/Ads-API/introduction>.

## X (Twitter)

**الملف**: `src/lib/integrations/providers/x.ts`

1. أنشئ مشروعاً وتطبيقاً من <https://developer.x.com/en/portal/dashboard> (خطة Basic أو أعلى للنشر البرمجي).
2. فعّل **OAuth 1.0a** (User context) للنشر، واحصل على مفاتيح الوصول من App → Keys and tokens.
3. المتغيرات: `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`.
4. نقاط: النشر `POST /2/tweets` (الثريد عبر `reply.in_reply_to_tweet_id`)؛ القياسات `GET /2/tweets?ids=…&tweet.fields=public_metrics`.

## LinkedIn

**الملف**: `src/lib/integrations/providers/linkedin.ts`

1. أنشئ تطبيقاً من <https://developer.linkedin.com> واربطه بصفحة الشركة، ثم اطلب منتج **Community Management API**.
2. الأذونات: `w_organization_social`, `r_organization_social`, `rw_organization_admin`.
3. المتغيرات: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_ORGANIZATION_ID` (رقم `urn:li:organization:XXXX`).
4. النشر: `POST /rest/posts` بحساب المؤسسة؛ التحليلات: `GET /rest/organizationalEntityShareStatistics`.

## Google Ads

**الملف**: `src/lib/integrations/providers/google-ads.ts`

1. أنشئ مشروعاً في <https://console.cloud.google.com> وفعّل **Google Ads API**، وأنشئ OAuth Client (Web).
2. اطلب **Developer Token** من حساب Google Ads Manager (MCC) — يبدأ بوضع تجريبي ثم Basic Access.
3. نفّذ تدفق OAuth للحصول على Refresh Token.
4. المتغيرات: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID` (بدون شرطات).
5. يُنصح بمكتبة `google-ads-api` من npm. التوثيق: <https://developers.google.com/google-ads/api/docs/start>.

## YouTube

**الملف**: `src/lib/integrations/providers/youtube.ts`

1. في نفس مشروع Google Cloud فعّل **YouTube Data API v3**.
2. للقراءة (إحصاءات القناة والفيديوهات) يكفي **API Key**؛ للرفع تحتاج OAuth بأذونات `https://www.googleapis.com/auth/youtube.upload`.
3. المتغيرات: `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`.
4. نقاط: `GET /youtube/v3/channels?part=statistics`؛ الرفع `videos.insert`.

---

## نقاط TODO إضافية خارج المزوّدين

| الموضع | الملف | المطلوب عند الربط |
|---|---|---|
| إيقاف/تفعيل الحملات | `src/app/(app)/ads/actions.ts` | استدعاء ads API للمنصة إضافة إلى تحديث القاعدة المحلية |
| جدولة التقارير | `src/app/(app)/reports/actions.ts` | ربط جدولة فعلية (cron/queue) تولّد التقرير وترسله بالبريد |
| النشر المجدول | `MockSocialAdapter.schedulePost` | مشغّل زمني ينفّذ `publishPost` عند حلول الموعد |

## تذكير أمني

- لا ترفع `.env` إلى Git أبداً (المستودع يتجاهله).
- خزّن المفاتيح الدائمة في Secrets Manager عند النشر الإنتاجي.
- حقول المفاتيح في شاشة الإعدادات **عرض فقط** الآن عمداً — التخزين الفعلي يجب أن يكون مشفّراً (نموذج `ApiCredential` جاهز في المخطط).
