import { forwardToAdmin } from "@/lib/luciaAdmin";

/** Conocimiento del negocio que edita /lucia/knowledge. */
export async function GET() {
  return forwardToAdmin("/knowledge", { method: "GET" });
}

export async function PUT(request: Request) {
  return forwardToAdmin("/knowledge", { method: "PUT", body: await request.text() });
}
