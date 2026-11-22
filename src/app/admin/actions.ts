"use server";

import { updateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog";
import { requireAdmin } from "@/lib/session";

// Every admin action authorizes itself: server actions are public POST endpoints,
// so the /admin page check doesn't cover them.
export async function refreshCatalogAction() {
  await requireAdmin();
  updateTag(CATALOG_TAG);
}
