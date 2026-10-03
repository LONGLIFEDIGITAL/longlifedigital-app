import { useEffect, useRef, useState } from 'react';

function requestId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export default function usePublicForm(action) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(null);
  const attempt = useRef(null);
  useEffect(() => () => active.current?.abort(), []);
  async function submit(payload) {
    if (active.current) return false;
    const fingerprint = JSON.stringify(payload);
    if (attempt.current?.fingerprint !== fingerprint)
      attempt.current = { fingerprint, id: requestId() };
    const controller = new AbortController();
    active.current = controller;
    const timer = setTimeout(
      () => controller.abort(new DOMException('Timed out', 'TimeoutError')),
      25000,
    );
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/forms?action=${action}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-LLD-Commerce': '1' },
        signal: controller.signal,
        body: JSON.stringify({ ...payload, requestId: attempt.current.id }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.ok !== true)
        throw new Error(data?.error || 'We couldn’t complete your request. Please try again.');
      attempt.current = null;
      return true;
    } catch (failure) {
      if (controller.signal.aborted && controller.signal.reason?.name !== 'TimeoutError')
        return false;
      setError(
        controller.signal.aborted
          ? 'We couldn’t confirm your request in time. Please try again.'
          : failure instanceof TypeError
            ? 'We couldn’t connect. Check your connection and try again.'
            : failure.message,
      );
      return false;
    } finally {
      clearTimeout(timer);
      active.current = null;
      if (!controller.signal.aborted || controller.signal.reason?.name === 'TimeoutError')
        setBusy(false);
    }
  }
  return { submit, busy, error };
}
