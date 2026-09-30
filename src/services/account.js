let queue = Promise.resolve();
export function accountRequest(action, body, page = 1) {
  // Start the deadline before waiting for our queue or another tab's lock.
  // Otherwise a suspended tab can leave a form busy without ever reaching fetch.
  const controller = new AbortController();
  const { signal } = controller;
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new DOMException('Account request timed out.', 'TimeoutError');
      controller.abort(error);
      reject(error);
    }, 25000);
  });
  const run = async () => {
    signal.throwIfAborted();
    const response = await fetch(
      `/api/account?action=${encodeURIComponent(action)}${action === 'orders' ? `&page=${page}` : ''}`,
      {
        method: body === undefined ? 'GET' : 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        signal,
        headers: { 'Content-Type': 'application/json', 'X-LLD-Commerce': '1' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      },
    ).catch(() => {
      signal.throwIfAborted();
      const error = new Error(
        'We couldn’t reach the account server. Check your connection and try again.',
      );
      error.name = 'NetworkError';
      throw error;
    });
    let data;
    try {
      data = await response.json();
    } catch {
      signal.throwIfAborted();
      throw new Error('Accounts are temporarily unavailable. Please try again.');
    }
    if (!response.ok) {
      const error = new Error(
        (typeof data?.error === 'string' && data.error) ||
          'Accounts are temporarily unavailable. Please try again.',
      );
      error.status = response.status;
      throw error;
    }
    return data;
  };
  const operation = queue.then(() => {
    // A timed-out queued submission must never execute later in the background.
    signal.throwIfAborted();
    return globalThis.navigator?.locks
      ? navigator.locks.request('lld-account', { signal }, run)
      : run();
  });
  const task = Promise.race([operation, deadline]).finally(() => clearTimeout(timer));
  queue = task.catch(() => {});
  return task;
}
