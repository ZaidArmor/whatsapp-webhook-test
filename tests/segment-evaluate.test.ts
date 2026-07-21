import { describe, expect, it } from "vitest";
import { evaluateCondition, evaluateGroup, evaluateTree, type SegmentEvaluableCustomer } from "@/lib/segments/evaluate";
import type { SegmentConditionInput, SegmentGroupInput, SegmentTreeInput } from "@/lib/segments/types";

function baseCustomer(overrides: Partial<SegmentEvaluableCustomer> = {}): SegmentEvaluableCustomer {
  return {
    city: "الرياض",
    branchId: "branch-1",
    serviceId: "service-1",
    campaignId: "campaign-1",
    platform: "META_ADS",
    source: "FACEBOOK",
    status: "NEW",
    totalPurchaseValue: 0,
    lastPurchaseAt: null,
    lastContactAt: new Date(),
    firstContactAt: new Date(),
    marketingConsent: true,
    isDuplicate: false,
    phoneValidity: "VALID",
    tagNames: ["VIP"],
    ...overrides,
  };
}

function cond(partial: Partial<SegmentConditionInput>): SegmentConditionInput {
  return { id: "c1", field: "CITY", operator: "EQUALS", value: null, ...partial };
}

describe("evaluateCondition", () => {
  it("matches text equality case-insensitively", () => {
    const customer = baseCustomer({ city: "جدة" });
    expect(evaluateCondition(customer, cond({ field: "CITY", operator: "EQUALS", value: "جدة" }))).toBe(true);
    expect(evaluateCondition(customer, cond({ field: "CITY", operator: "EQUALS", value: "الرياض" }))).toBe(false);
  });

  it("evaluates numeric comparisons for purchase value", () => {
    const customer = baseCustomer({ totalPurchaseValue: 5000 });
    expect(evaluateCondition(customer, cond({ field: "PURCHASE_VALUE", operator: "GREATER_THAN", value: 1000 }))).toBe(true);
    expect(evaluateCondition(customer, cond({ field: "PURCHASE_VALUE", operator: "LESS_THAN", value: 1000 }))).toBe(false);
  });

  it("evaluates boolean fields with IS_TRUE / IS_FALSE", () => {
    const customer = baseCustomer({ marketingConsent: false });
    expect(evaluateCondition(customer, cond({ field: "MARKETING_CONSENT", operator: "IS_FALSE" }))).toBe(true);
    expect(evaluateCondition(customer, cond({ field: "MARKETING_CONSENT", operator: "IS_TRUE" }))).toBe(false);
  });

  it("matches tags regardless of case", () => {
    const customer = baseCustomer({ tagNames: ["Vip", "New"] });
    expect(evaluateCondition(customer, cond({ field: "TAG", operator: "EQUALS", value: "vip" }))).toBe(true);
    expect(evaluateCondition(customer, cond({ field: "TAG", operator: "EQUALS", value: "gold" }))).toBe(false);
  });

  it("flags customers inactive for more than N days (OLDER_THAN_DAYS)", () => {
    const longAgo = new Date();
    longAgo.setDate(longAgo.getDate() - 200);
    const customer = baseCustomer({ lastContactAt: longAgo });
    expect(evaluateCondition(customer, cond({ field: "INACTIVE_DAYS", operator: "OLDER_THAN_DAYS", value: 90 }))).toBe(true);
    expect(evaluateCondition(customer, cond({ field: "INACTIVE_DAYS", operator: "OLDER_THAN_DAYS", value: 365 }))).toBe(false);
  });

  it("treats a customer never contacted as inactive", () => {
    const customer = baseCustomer({ lastContactAt: null });
    expect(evaluateCondition(customer, cond({ field: "INACTIVE_DAYS", operator: "OLDER_THAN_DAYS", value: 30 }))).toBe(true);
  });

  it("evaluates IN / NOT_IN against a list of values", () => {
    const customer = baseCustomer({ status: "SOLD" });
    expect(evaluateCondition(customer, cond({ field: "CUSTOMER_STATUS", operator: "IN", value: ["SOLD", "PAST_CUSTOMER"] }))).toBe(
      true
    );
    expect(
      evaluateCondition(customer, cond({ field: "CUSTOMER_STATUS", operator: "NOT_IN", value: ["SOLD", "PAST_CUSTOMER"] }))
    ).toBe(false);
  });
});

describe("evaluateGroup", () => {
  const highValue = cond({ field: "PURCHASE_VALUE", operator: "GREATER_THAN", value: 3000 });
  const isRiyadh = cond({ field: "CITY", operator: "EQUALS", value: "الرياض" });

  it("requires all conditions to match under AND", () => {
    const group: SegmentGroupInput = { id: "g1", logicalOperator: "AND", conditions: [highValue, isRiyadh] };
    const matches = baseCustomer({ totalPurchaseValue: 5000, city: "الرياض" });
    const failsOne = baseCustomer({ totalPurchaseValue: 5000, city: "جدة" });
    expect(evaluateGroup(matches, group)).toBe(true);
    expect(evaluateGroup(failsOne, group)).toBe(false);
  });

  it("requires only one condition to match under OR", () => {
    const group: SegmentGroupInput = { id: "g2", logicalOperator: "OR", conditions: [highValue, isRiyadh] };
    const onlyCity = baseCustomer({ totalPurchaseValue: 0, city: "الرياض" });
    const neither = baseCustomer({ totalPurchaseValue: 0, city: "جدة" });
    expect(evaluateGroup(onlyCity, group)).toBe(true);
    expect(evaluateGroup(neither, group)).toBe(false);
  });

  it("an empty group matches everything (no restriction)", () => {
    const group: SegmentGroupInput = { id: "g3", logicalOperator: "AND", conditions: [] };
    expect(evaluateGroup(baseCustomer(), group)).toBe(true);
  });
});

describe("evaluateTree — nested AND/OR groups", () => {
  it("supports (A AND B) OR (C AND D) style nested segments", () => {
    // Past PPF customers in Riyadh, OR anyone with a pending quote in Jeddah
    const groupPpfRiyadh: SegmentGroupInput = {
      id: "g1",
      logicalOperator: "AND",
      conditions: [cond({ field: "CITY", operator: "EQUALS", value: "الرياض" }), cond({ field: "CUSTOMER_STATUS", operator: "EQUALS", value: "PAST_CUSTOMER" })],
    };
    const groupQuoteJeddah: SegmentGroupInput = {
      id: "g2",
      logicalOperator: "AND",
      conditions: [cond({ field: "CITY", operator: "EQUALS", value: "جدة" }), cond({ field: "CUSTOMER_STATUS", operator: "EQUALS", value: "QUOTE_REQUESTED" })],
    };
    const tree: SegmentTreeInput = { topLogicalOperator: "OR", groups: [groupPpfRiyadh, groupQuoteJeddah] };

    const matchesFirstGroup = baseCustomer({ city: "الرياض", status: "PAST_CUSTOMER" });
    const matchesSecondGroup = baseCustomer({ city: "جدة", status: "QUOTE_REQUESTED" });
    const matchesNeither = baseCustomer({ city: "جدة", status: "PAST_CUSTOMER" });

    expect(evaluateTree(matchesFirstGroup, tree)).toBe(true);
    expect(evaluateTree(matchesSecondGroup, tree)).toBe(true);
    expect(evaluateTree(matchesNeither, tree)).toBe(false);
  });
});
