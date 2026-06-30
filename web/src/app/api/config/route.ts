import { configCol } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const idDoc = await configCol.ref.doc("contract_id").get();
    const networkDoc = await configCol.ref.doc("contract_network").get();

    return Response.json({
      contract_id: idDoc.exists ? idDoc.data()?.value : null,
      contract_network: networkDoc.exists ? networkDoc.data()?.value : null,
    });
  } catch (err) {
    return Response.json({ error: "Failed to load config" }, { status: 500 });
  }
}
