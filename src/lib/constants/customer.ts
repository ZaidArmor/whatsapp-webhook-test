import type { CustomerStatus, LeadSource, PhoneValidity } from "@prisma/client";

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  NEW: "جديد",
  CONTACTED: "تم التواصل",
  INTERESTED: "مهتم",
  QUOTE_REQUESTED: "طلب عرض سعر",
  BOOKED: "حجز موعد",
  ATTENDED: "حضر",
  SOLD: "تم البيع",
  NO_ANSWER: "لم يرد",
  NOT_INTERESTED: "غير مهتم",
  POSTPONED: "مؤجل",
  PAST_CUSTOMER: "عميل سابق",
  RETARGETING_OPPORTUNITY: "فرصة إعادة استهداف",
};

export const CUSTOMER_STATUS_VARIANT: Record<
  CustomerStatus,
  "success" | "secondary" | "warning" | "destructive" | "muted" | "default"
> = {
  NEW: "secondary",
  CONTACTED: "secondary",
  INTERESTED: "default",
  QUOTE_REQUESTED: "default",
  BOOKED: "warning",
  ATTENDED: "warning",
  SOLD: "success",
  NO_ANSWER: "muted",
  NOT_INTERESTED: "destructive",
  POSTPONED: "muted",
  PAST_CUSTOMER: "secondary",
  RETARGETING_OPPORTUNITY: "warning",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  FACEBOOK: "فيسبوك",
  INSTAGRAM: "إنستغرام",
  TIKTOK: "تيك توك",
  SNAPCHAT: "سناب شات",
  GOOGLE: "جوجل",
  WHATSAPP: "واتساب",
  WEBSITE: "الموقع الإلكتروني",
  WALK_IN: "زيارة مباشرة",
  REFERRAL: "إحالة",
  CALL_CENTER: "مركز الاتصال",
  OTHER: "أخرى",
};

export const PHONE_VALIDITY_LABELS: Record<PhoneValidity, string> = {
  VALID: "صحيح",
  INVALID: "غير صحيح",
  UNKNOWN: "غير معروف",
};
