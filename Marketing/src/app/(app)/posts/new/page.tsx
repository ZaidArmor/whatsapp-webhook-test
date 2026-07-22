import { getT } from "@/lib/i18n/server";
import { requirePermission } from "@/lib/auth/workspace";
import { getConnectedAccounts, getMediaLibrary, getBestTimes } from "@/lib/data/posts";
import { Composer } from "@/components/posts/composer";
import { BestTimesPanel } from "@/components/posts/best-times";

export default async function NewPostPage() {
  const { t } = await getT();
  const ctx = await requirePermission("create_posts");

  const [accounts, media, bestTimes] = await Promise.all([
    getConnectedAccounts(ctx.workspaceId),
    getMediaLibrary(ctx.workspaceId),
    getBestTimes(ctx.workspaceId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("posts.newPost")}</h1>
        <p className="text-sm text-muted-foreground">{t("posts.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <Composer
          accounts={accounts}
          media={media.map((m) => ({ id: m.id, url: m.url, fileName: m.fileName, kind: m.kind }))}
          canPublish={ctx.can("publish_posts")}
        />
        <BestTimesPanel slots={bestTimes} />
      </div>
    </div>
  );
}
