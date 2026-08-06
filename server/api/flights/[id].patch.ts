import { serverSupabaseClient } from "#supabase/server";
import { requireUser } from "~~/server/utils/auth";
import { toFlightColumns } from "~~/server/utils/flightRow";
import { flightInputSchema } from "~~/shared/schema";
import { PP_RESOLVE_ERROR_MESSAGE, resolvePP } from "~~/shared/pp";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const client = await serverSupabaseClient(event);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing id" });

  const body = await readBody(event);
  const parsed = flightInputSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation failed",
      data: { issues: parsed.error.issues },
    });
  }

  const pp = resolvePP(parsed.data);
  if (pp == null) {
    throw createError({ statusCode: 400, statusMessage: PP_RESOLVE_ERROR_MESSAGE });
  }

  const { data, error } = await client
    .from("flights")
    .update(toFlightColumns(parsed.data, pp))
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }
  return data;
});
