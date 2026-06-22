import type { RequestOptions, RequestResponse } from "../types/types.ts";
import { RequestMethod, ResponseType } from "../types/types.ts";

export async function makeRequest<T extends ResponseType>(
  url: string,
  options: RequestOptions<T>,
): Promise<RequestResponse[T]> {
  const u = new URL(url);
  if (options.params) u.search = new URLSearchParams(options.params).toString();

  const c = new AbortController();
  const id = setTimeout(() => c.abort(), options.timeout ?? 20_000);

  try {
    const res = await fetch(u.toString(), {
      method: options.method,
      headers: options.headers,
      body: options.body != null && options.method !== RequestMethod.GET ? JSON.stringify(options.body) : undefined,
      signal: c.signal,
    });

    if (!res.ok) throw new Error(`Request failed with status ${res.status}: ${(await res.text().catch(() => ""))}`);

    return options.response === ResponseType.BUFFER
      ? Buffer.from(await res.arrayBuffer())
      : options.response === ResponseType.JSON
        ? await res.json()
        : await res.text();
  } finally {
    clearTimeout(id);
  }
}
