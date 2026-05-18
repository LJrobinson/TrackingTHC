"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/server/auth/permissions";
import { getOperationalContext } from "@/server/core/context";
import { processPendingFakeSyncJobs, simulateFakeSyncJobFailure } from "@/server/metrc/fake-sync.service";

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function processPendingSyncJobs() {
  await assertPermission("sync:write");

  const context = await getOperationalContext();

  await processPendingFakeSyncJobs(context.actorUserId);

  revalidatePath("/sync-status");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

export async function simulateSyncFailure(formData: FormData) {
  await assertPermission("sync:write");

  const context = await getOperationalContext();
  const jobId = getText(formData, "jobId");
  const reason = getText(formData, "reason");

  await simulateFakeSyncJobFailure({
    actorUserId: context.actorUserId,
    jobId,
    reason
  });

  revalidatePath("/sync-status");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
