"use server";

import { revalidatePath } from "next/cache";
import { getOperationalContext } from "@/server/core/context";
import { processPendingFakeSyncJobs } from "@/server/metrc/fake-sync.service";

export async function processPendingSyncJobs() {
  const context = await getOperationalContext();

  await processPendingFakeSyncJobs(context.actorUserId);

  revalidatePath("/sync-status");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
