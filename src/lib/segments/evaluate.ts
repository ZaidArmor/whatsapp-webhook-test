import type { SegmentConditionField, SegmentConditionOperator } from "@prisma/client";
import type { SegmentConditionInput, SegmentGroupInput, SegmentTreeInput } from "./types";

export interface SegmentEvaluableCustomer {
  city: string | null;
  branchId: string | null;
  serviceId: string | null;
  campaignId: string | null;
  platform: string | null;
  source: string | null;
  status: string;
  totalPurchaseValue: number;
  lastPurchaseAt: Date | null;
  lastContactAt: Date | null;
  firstContactAt: Date | null;
  marketingConsent: boolean;
  isDuplicate: boolean;
  phoneValidity: string;
  tagNames: string[];
}

function fieldToRawValue(customer: SegmentEvaluableCustomer, field: SegmentConditionField): unknown {
  switch (field) {
    case "CITY":
      return customer.city;
    case "BRANCH":
      return customer.branchId;
    case "SERVICE":
      return customer.serviceId;
    case "CAMPAIGN":
      return customer.campaignId;
    case "PLATFORM":
      return customer.platform;
    case "SOURCE":
      return customer.source;
    case "CUSTOMER_STATUS":
      return customer.status;
    case "PURCHASE_VALUE":
      return customer.totalPurchaseValue;
    case "LAST_PURCHASE_DATE":
      return customer.lastPurchaseAt;
    case "LAST_CONTACT_DATE":
      return customer.lastContactAt;
    case "FIRST_CONTACT_DATE":
      return customer.firstContactAt;
    case "MARKETING_CONSENT":
      return customer.marketingConsent;
    case "IS_DUPLICATE":
      return customer.isDuplicate;
    case "PHONE_VALIDITY":
      return customer.phoneValidity;
    case "TAG":
      return customer.tagNames;
    case "INACTIVE_DAYS":
      return customer.lastContactAt;
    default:
      return null;
  }
}

function daysSince(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}

export function evaluateCondition(customer: SegmentEvaluableCustomer, condition: SegmentConditionInput): boolean {
  const { field, operator, value } = condition;
  const raw = fieldToRawValue(customer, field);

  switch (operator as SegmentConditionOperator) {
    case "IS_TRUE":
      return raw === true;
    case "IS_FALSE":
      return raw === false;
    case "EQUALS":
      if (field === "TAG") return Array.isArray(raw) && raw.some((t) => t.toLowerCase() === String(value).toLowerCase());
      return String(raw ?? "").toLowerCase() === String(value ?? "").toLowerCase();
    case "NOT_EQUALS":
      if (field === "TAG") return !(Array.isArray(raw) && raw.some((t) => t.toLowerCase() === String(value).toLowerCase()));
      return String(raw ?? "").toLowerCase() !== String(value ?? "").toLowerCase();
    case "CONTAINS":
      return String(raw ?? "")
        .toLowerCase()
        .includes(String(value ?? "").toLowerCase());
    case "IN":
      return Array.isArray(value) && value.some((v) => String(v).toLowerCase() === String(raw ?? "").toLowerCase());
    case "NOT_IN":
      return !(Array.isArray(value) && value.some((v) => String(v).toLowerCase() === String(raw ?? "").toLowerCase()));
    case "GREATER_THAN":
      return Number(raw ?? 0) > Number(value);
    case "LESS_THAN":
      return Number(raw ?? 0) < Number(value);
    case "GREATER_OR_EQUAL":
      return Number(raw ?? 0) >= Number(value);
    case "LESS_OR_EQUAL":
      return Number(raw ?? 0) <= Number(value);
    case "BEFORE":
      return raw instanceof Date && raw.getTime() < new Date(String(value)).getTime();
    case "AFTER":
      return raw instanceof Date && raw.getTime() > new Date(String(value)).getTime();
    case "OLDER_THAN_DAYS":
      if (!(raw instanceof Date)) return field === "INACTIVE_DAYS"; // never contacted counts as inactive
      return daysSince(raw) >= Number(value);
    default:
      return false;
  }
}

export function evaluateGroup(customer: SegmentEvaluableCustomer, group: SegmentGroupInput): boolean {
  if (group.conditions.length === 0) return true;
  return group.logicalOperator === "AND"
    ? group.conditions.every((c) => evaluateCondition(customer, c))
    : group.conditions.some((c) => evaluateCondition(customer, c));
}

export function evaluateTree(customer: SegmentEvaluableCustomer, tree: SegmentTreeInput): boolean {
  if (tree.groups.length === 0) return true;
  return tree.topLogicalOperator === "AND"
    ? tree.groups.every((g) => evaluateGroup(customer, g))
    : tree.groups.some((g) => evaluateGroup(customer, g));
}
