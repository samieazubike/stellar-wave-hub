import { configCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || auth.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { contract_id, contract_network } = body;

    if (contract_id !== undefined) {
      await configCol.ref.doc("contract_id").set({ key: "contract_id", value: contract_id, updated_at: new Date().toISOString() });
    }
    if (contract_network !== undefined) {
      await configCol.ref.doc("contract_network").set({ key: "contract_network", value: contract_network, updated_at: new Date().toISOString() });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Admin contract config error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
