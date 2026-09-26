// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { renderWithIntl } from '@/test/render';
import { CreateSampleButton } from './create-sample-button';

const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => nav, usePathname: () => '/' }));
vi.mock('@/lib/browser-timezone', () => ({ detectBrowserTimeZone: vi.fn(() => 'UTC') }));

describe('CreateSampleButton', () => {
  test('REQ-142: a failed creation says why and the button works again', async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, code: 'INTERNAL_ERROR' })
      .mockResolvedValueOnce({ ok: true, data: { slug: 'abc' } });
    renderWithIntl(<CreateSampleButton create={create} />);

    fireEvent.click(screen.getByRole('button', { name: 'Create sample event' }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Something went wrong. Please try again.',
    );
    const button = screen.getByRole('button', { name: 'Create sample event' });
    expect(button.getAttribute('aria-busy')).toBeNull();
    fireEvent.click(button);
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith('/e/abc'));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(create).toHaveBeenCalledWith('UTC');
  });
});
