/** Serves an event's .ics calendar file; open to anyone, no locale prefix (REQ-42). */
export async function GET(
  _request: Request,
  _context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  throw new Error('not implemented');
}
