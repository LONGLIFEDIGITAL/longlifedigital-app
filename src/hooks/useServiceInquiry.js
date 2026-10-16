import { useEffect, useRef, useState } from 'react';

function inquiryId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export default function useServiceInquiry() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const active = useRef(null);
  const attempt = useRef(null);
  const notice = useRef(null);
  useEffect(() => () => active.current?.abort(), []);
  async function submit(payload) {
    if (active.current) return;
    const fingerprint = JSON.stringify(payload);
    if (attempt.current?.fingerprint !== fingerprint)
      attempt.current = { fingerprint, id: inquiryId() };
    const controller = new AbortController();
    active.current = controller;
    const timer = setTimeout(
      () => controller.abort(new DOMException('Timed out', 'TimeoutError')),
      25000,
    );
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-LLD-Commerce': '1' },
        signal: controller.signal,
        body: JSON.stringify({ ...payload, requestId: attempt.current.id }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.ok !== true)
        throw new Error(
          data?.error ||
            'We couldn’t send your inquiry. Please try again or email info@longlifedigital.co.',
        );
      setSent(true);
    } catch (failure) {
      if (controller.signal.aborted && controller.signal.reason?.name !== 'TimeoutError') return;
      setError(
        controller.signal.aborted
          ? 'We couldn’t confirm your inquiry. Please try again or email info@longlifedigital.co.'
          : failure instanceof TypeError
            ? 'We couldn’t connect. Check your connection and try again.'
            : failure.message,
      );
    } finally {
      clearTimeout(timer);
      active.current = null;
      setBusy(false);
      requestAnimationFrame(() => notice.current?.focus());
    }
  }
  return { busy, error, sent, notice, submit };
}
