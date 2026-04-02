import { db } from "./db";

export async function generateInternalId(): Promise<string> {
  const counter = await db.counter.upsert({
    where: { name: "template_internal_id" },
    update: { value: { increment: 1 } },
    create: { name: "template_internal_id", value: 1 },
  });

  return `COM-${String(counter.value).padStart(4, "0")}`;
}
