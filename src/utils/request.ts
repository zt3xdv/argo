import type { RequestOptions, RequestResponse } from '../types/types.ts';
import { RequestMethod, ResponseType } from '../types/types.ts';

export async function makeRequest<Type extends ResponseType>(
  url: string,
  options: RequestOptions<Type>,
): Promise<RequestResponse[Type]> {
  const parsedUrl = new URL(url);

  const timeout = options.timeout || 20000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const controller = new AbortController();

  if (options.params) {
    parsedUrl.search = new URLSearchParams(options.params).toString();
  }

  try {
    const res = await fetch(parsedUrl.toString(), {
      method: options.method,
      headers: options.headers,
      body: options.body && options.method !== RequestMethod.GET ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const e = await res.text().catch(() => '');
      throw new Error(`Request failed with status ${res.status}: ${e}`);
    }

    switch (options.response) {
      case ResponseType.BUFFER: {
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer) as RequestResponse[Type];
      }
      case ResponseType.JSON: {
        return (await res.json()) as RequestResponse[Type];
      }
      default: {
        return (await res.text()) as RequestResponse[Type];
      }
    }
  } catch (e) {
    // Catch is useless there lol
    throw e;
  }
}
