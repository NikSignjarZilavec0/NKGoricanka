/**
 * Tiny in-memory Server-Sent-Events bus for live match updates.
 * Single app instance, so an in-process subscriber set is enough.
 */
const clients = new Set();

/** Attach an Express response as an SSE subscriber. */
export function addClient(res) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // disable proxy buffering (nginx/caddy)
  });
  res.flushHeaders?.();
  res.write(': connected\n\n'); // initial comment to open the stream

  clients.add(res);

  // Heartbeat so proxies/browsers keep the connection open.
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      /* ignore */
    }
  }, 25000);

  const cleanup = () => {
    clearInterval(heartbeat);
    clients.delete(res);
  };
  res.on('close', cleanup);
  res.on('error', cleanup);
}

/** Broadcast a match update to all subscribers. */
export function broadcastMatch(match) {
  const payload = `event: match\ndata: ${JSON.stringify(match)}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch {
      clients.delete(res);
    }
  }
}
