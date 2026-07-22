export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last7Days"
  | "last30Days"
  | "thisMonth"
  | "lastMonth"
  | "thisQuarter"
  | "thisYear"
  | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DashboardFilters {
  range: DateRange;
  preset: DateRangePreset;
  branchId?: string;
  platform?: string;
  adAccountId?: string;
  campaignId?: string;
  campaignObjective?: string;
  serviceId?: string;
  city?: string;
  employeeId?: string;
  source?: string;
}

export interface KpiValue {
  key: string;
  label: string;
  value: number | null;
  previousValue?: number | null;
  format: "number" | "currency" | "percent" | "text";
  textValue?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

/** Result of a session permission check, computed server-side from the user's roles. */
export interface SessionPermissions {
  userId: string;
  roles: string[];
  permissions: string[];
  branchId: string | null;
  canViewAllBranches: boolean;
}
