import { serverSupabaseClient } from "#supabase/server";
import { asFlightRow, type Database } from "~~/shared/database.types";
import { requireUser } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const client = await serverSupabaseClient<Database>(event);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing id" });

  const { data, error } = await client
    .from("flights")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    throw createError({ statusCode: 404, statusMessage: error.message });
  }
  return asFlightRow(data);
});
