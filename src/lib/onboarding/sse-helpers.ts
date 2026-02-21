/**
 * Shared SSE streaming utilities for onboarding routes.
 */

const encoder = new TextEncoder();

/** Standard SSE response headers */
export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no',
} as const;

/** Encode an SSE data line from a JSON-serialisable payload */
export function sseEvent(data: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

/** Convert an async generator of Uint8Array chunks into a pull-based ReadableStream */
export function streamFromGenerator(
  gen: AsyncGenerator<Uint8Array, void, unknown>
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await gen.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}
