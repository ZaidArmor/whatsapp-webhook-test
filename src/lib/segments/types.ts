import type { SegmentConditionField, SegmentConditionOperator } from "@prisma/client";

export const FIELD_LABELS: Record<SegmentConditionField, string> = {
  CITY: "المدينة",
  BRANCH: "الفرع",
  SERVICE: "الخدمة",
  CAMPAIGN: "الحملة",
  PLATFORM: "المنصة",
  SOURCE: "مصدر العميل",
  CUSTOMER_STATUS: "حالة العميل",
  PURCHASE_VALUE: "قيمة المشتريات",
  LAST_PURCHASE_DATE: "تاريخ آخر شراء",
  LAST_CONTACT_DATE: "تاريخ آخر تواصل",
  FIRST_CONTACT_DATE: "تاريخ أول تواصل",
  MARKETING_CONSENT: "الموافقة التسويقية",
  IS_DUPLICATE: "عميل مكرر",
  PHONE_VALIDITY: "صحة رقم الجوال",
  TAG: "الوسم",
  INACTIVE_DAYS: "أيام عدم النشاط",
};

export type FieldValueType = "text" | "number" | "boolean" | "date" | "select" | "days";

export const FIELD_VALUE_TYPE: Record<SegmentConditionField, FieldValueType> = {
  CITY: "text",
  BRANCH: "select",
  SERVICE: "select",
  CAMPAIGN: "select",
  PLATFORM: "select",
  SOURCE: "select",
  CUSTOMER_STATUS: "select",
  PURCHASE_VALUE: "number",
  LAST_PURCHASE_DATE: "date",
  LAST_CONTACT_DATE: "date",
  FIRST_CONTACT_DATE: "date",
  MARKETING_CONSENT: "boolean",
  IS_DUPLICATE: "boolean",
  PHONE_VALIDITY: "select",
  TAG: "text",
  INACTIVE_DAYS: "days",
};

export const OPERATOR_LABELS: Record<SegmentConditionOperator, string> = {
  EQUALS: "يساوي",
  NOT_EQUALS: "لا يساوي",
  GREATER_THAN: "أكبر من",
  LESS_THAN: "أصغر من",
  GREATER_OR_EQUAL: "أكبر أو يساوي",
  LESS_OR_EQUAL: "أصغر أو يساوي",
  CONTAINS: "يحتوي على",
  IN: "ضمن",
  NOT_IN: "ليس ضمن",
  IS_TRUE: "صحيح",
  IS_FALSE: "غير صحيح",
  BEFORE: "قبل",
  AFTER: "بعد",
  OLDER_THAN_DAYS: "أقدم من (أيام)",
};

export const OPERATORS_BY_VALUE_TYPE: Record<FieldValueType, SegmentConditionOperator[]> = {
  text: ["EQUALS", "NOT_EQUALS", "CONTAINS"],
  number: ["EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN", "GREATER_OR_EQUAL", "LESS_OR_EQUAL"],
  boolean: ["IS_TRUE", "IS_FALSE"],
  date: ["BEFORE", "AFTER"],
  select: ["EQUALS", "NOT_EQUALS", "IN", "NOT_IN"],
  days: ["OLDER_THAN_DAYS"],
};

export interface SegmentConditionInput {
  id: string;
  field: SegmentConditionField;
  operator: SegmentConditionOperator;
  value: string | number | boolean | string[] | null;
}

export interface SegmentGroupInput {
  id: string;
  logicalOperator: "AND" | "OR";
  conditions: SegmentConditionInput[];
}

export interface SegmentTreeInput {
  topLogicalOperator: "AND" | "OR";
  groups: SegmentGroupInput[];
}
