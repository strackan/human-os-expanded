"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function saveSnapshotToProfile(jobId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };
  if (!jobId) return { success: false, error: "Missing job ID" };

  const serviceClient = getSupabaseServer();
  if (!serviceClient) return { success: false, error: "Server error" };

  const { error } = await serviceClient
    .schema("fancyrobot")
    .from("snapshot_runs")
    .update({ user_id: user.id })
    .eq("id", jobId)
    .is("user_id", null);

  if (error) {
    console.error("Save snapshot error:", error);
    return { success: false, error: "Failed to save snapshot" };
  }

  return { success: true };
}
