import { NextRequest } from "next/server";

const API = process.env.DUA_API_ORIGIN ?? "http://localhost:8080";
const TIMEOUT_MS = 25_000;

async function proxy(req: NextRequest, path: string[]): Promise<Response> {
  const target = `${API}/v1/${path.join("/")}${req.nextUrl.search}`;
  const headers = new Headers();
  const pass = ["authorization", "content-type", "accept", "accept-language"];
  for (const key of pass) {
    const value = req.headers.get(key);
    if (value) headers.set(key, value);
  }
  const method = req.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();
  try {
    const res = await fetch(target, {
      method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const out = new Headers(res.headers);
    out.delete("transfer-encoding");
    out.delete("connection");
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out });
  } catch (err) {
    if (isTimeout(err)) {
      return Response.json(
        { error: { code: "ai_provider_timeout", message: "the AI provider took too long to answer; try again" } },
        { status: 504 },
      );
    }
    return Response.json(
      { error: { code: "ai_provider_unreachable", message: "the AI service is unreachable" } },
      { status: 502 },
    );
  }
}

function isTimeout(err: unknown): boolean {
  return err instanceof DOMException && (err.name === "AbortError" || err.name === "TimeoutError");
}

type Ctx = { params: Promise<{ path: string[] }> };

export const GET = (req: NextRequest, ctx: Ctx) => ctx.params.then(({ path }) => proxy(req, path));
export const POST = (req: NextRequest, ctx: Ctx) => ctx.params.then(({ path }) => proxy(req, path));
export const PUT = (req: NextRequest, ctx: Ctx) => ctx.params.then(({ path }) => proxy(req, path));
export const PATCH = (req: NextRequest, ctx: Ctx) => ctx.params.then(({ path }) => proxy(req, path));
export const DELETE = (req: NextRequest, ctx: Ctx) => ctx.params.then(({ path }) => proxy(req, path));
