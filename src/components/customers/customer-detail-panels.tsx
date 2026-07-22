"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CustomerStatus } from "@prisma/client";
import { Trash2, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { CUSTOMER_STATUS_LABELS } from "@/lib/constants/customer";
import {
  updateCustomerStatusAction,
  addCustomerNoteAction,
  addCustomerTagAction,
  removeCustomerTagAction,
  updateMarketingConsentAction,
  softDeleteCustomerAction,
} from "@/app/(app)/customers/actions";

export function CustomerStatusSelect({ customerId, status }: { customerId: string; status: CustomerStatus }) {
  const [pending, startTransition] = React.useTransition();

  return (
    <Select
      value={status}
      disabled={pending}
      onValueChange={(value) =>
        startTransition(() => {
          void updateCustomerStatusAction({ customerId, status: value as CustomerStatus });
        })
      }
    >
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.values(CustomerStatus).map((s) => (
          <SelectItem key={s} value={s}>
            {CUSTOMER_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CustomerTagsEditor({
  customerId,
  tags,
}: {
  customerId: string;
  tags: Array<{ id: string; name: string }>;
}) {
  const [value, setValue] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <Badge key={tag.id} variant="muted" className="gap-1">
          {tag.name}
          <button
            onClick={() => startTransition(() => void removeCustomerTagAction({ customerId, tagId: tag.id }))}
            className="opacity-60 hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim()) return;
          startTransition(() => void addCustomerTagAction({ customerId, tagName: value.trim() }));
          setValue("");
        }}
        className="flex items-center gap-1"
      >
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="إضافة وسم..."
          className="h-7 w-32 text-xs"
          disabled={pending}
        />
      </form>
    </div>
  );
}

export function CustomerNotesForm({ customerId, initialNote }: { customerId: string; initialNote: string | null }) {
  const [value, setValue] = React.useState(initialNote ?? "");
  const [pending, startTransition] = React.useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>ملاحظات</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-input bg-transparent p-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="أضف ملاحظة حول هذا العميل..."
        />
        <Button
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => void addCustomerNoteAction({ customerId, note: value }))}
        >
          حفظ الملاحظة
        </Button>
      </CardContent>
    </Card>
  );
}

export function CustomerConsentToggle({ customerId, consent }: { customerId: string; consent: boolean }) {
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={consent}
        disabled={pending}
        onCheckedChange={(checked) =>
          startTransition(() => void updateMarketingConsentAction({ customerId, consent: checked }))
        }
      />
      <span className="text-sm text-muted-foreground">موافقة العميل على الرسائل التسويقية</span>
    </div>
  );
}

export function CustomerDeleteButton({ customerId }: { customerId: string }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" /> حذف العميل
      </Button>
      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        title="حذف العميل"
        description="سيتم إخفاء هذا العميل من القوائم (حذف مؤقت قابل للاستعادة). هل أنت متأكد؟"
        confirmLabel="حذف"
        destructive
        onConfirm={async () => {
          await softDeleteCustomerAction({ customerId });
          router.push("/customers");
        }}
      />
    </>
  );
}
