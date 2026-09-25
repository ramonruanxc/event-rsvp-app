import { NotFoundError } from '@/domain/errors';
import { getServices } from '@/lib/container';

/** Serves an event's .ics calendar file; open to anyone, no locale prefix (REQ-42). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;
  try {
    const { filename, body } = await getServices().exportEventIcs.execute({ slug });
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) return new Response('Not found', { status: 404 });
    console.error(error);
    return new Response('Internal error', { status: 500 });
  }
}
