import { serverSupabaseClient } from "#supabase/server";
import { requireUser } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
  await requireUser(event);
  const client = await serverSupabaseClient(event);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing id" });

  const { data, error } = await client
    .from("flights")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw createError({ statusCode: 404, statusMessage: error.message });
  }
  return data;
});
