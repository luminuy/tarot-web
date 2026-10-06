import { apiFail, apiOk } from "@/lib/api/envelope";
import { studioGate } from "@/lib/studio/gate";
import { ID } from "@/lib/studio/schemas";
import { deleteTemplate } from "@/lib/studio/studio.repo";

export const runtime = "nodejs";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const { id } = await params;
  if (!ID.template.test(id) || !(await deleteTemplate(gate.readerId, id))) return apiFail("ไม่พบแม่แบบ", 404);
  return apiOk();
}
