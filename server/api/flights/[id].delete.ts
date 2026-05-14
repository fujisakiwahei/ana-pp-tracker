import { serverSupabaseServiceRole } from "#supabase/server";
import { requireUser } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const client = serverSupabaseServiceRole(event);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing id" });

  const { error } = await client
    .from("flights")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }
  return { ok: true };
});
