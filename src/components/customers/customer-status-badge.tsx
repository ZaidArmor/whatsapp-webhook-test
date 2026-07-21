import type { CustomerStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { CUSTOMER_STATUS_LABELS, CUSTOMER_STATUS_VARIANT } from "@/lib/constants/customer";

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return <Badge variant={CUSTOMER_STATUS_VARIANT[status]}>{CUSTOMER_STATUS_LABELS[status]}</Badge>;
}
