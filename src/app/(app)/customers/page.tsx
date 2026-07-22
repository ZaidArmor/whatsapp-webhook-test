import Link from "next/link";
import { Upload } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getCustomersList, getCustomerFilterOptions } from "@/lib/data/customers";
import { canViewFullPhone } from "@/lib/phone/mask";
import { CustomerFilters } from "./customer-filters";
import { CustomersTableClient } from "@/components/customers/customers-table-client";
import { Button } from "@/components/ui/button";

interface CustomersPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;
  const session = await auth();
  const [customers, filterOptions] = await Promise.all([
    getCustomersList({
      status: params.status,
      branchId: params.branchId,
      serviceId: params.serviceId,
      platform: params.platform,
      source: params.source,
      city: params.city,
      phoneValidity: params.phoneValidity,
    }),
    getCustomerFilterOptions(),
  ]);

  const canViewFull = canViewFullPhone(session?.user.roles ?? []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">العملاء</h1>
          <p className="text-sm text-muted-foreground">{customers.length} عميل مطابق للفلاتر الحالية</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/customers/duplicates">العملاء المكررون</Link>
          </Button>
          <Button asChild>
            <Link href="/customers/import">
              <Upload className="h-4 w-4" /> استيراد
            </Link>
          </Button>
        </div>
      </div>

      <CustomerFilters options={filterOptions} />

      <CustomersTableClient data={customers} canViewFullPhone={canViewFull} />
    </div>
  );
}
