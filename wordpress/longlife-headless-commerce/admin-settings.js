(() => {
  const field = document.getElementById('lld-integration-secret');
  const toggle = document.getElementById('lld-secret-toggle');
  const copy = document.getElementById('lld-secret-copy');
  const status = document.getElementById('lld-secret-status');
  if (!field || !toggle || !copy || !status) return;

  function reveal(visible) {
    field.type = visible ? 'text' : 'password';
    toggle.textContent = visible ? 'Hide' : 'Show';
    toggle.setAttribute('aria-label', visible ? 'Hide integration secret' : 'Show integration secret');
    toggle.setAttribute('aria-pressed', String(visible));
  }

  toggle.addEventListener('click', () => {
    reveal(field.type === 'password');
    status.textContent = field.type === 'text' ? 'Secret is visible.' : 'Secret is hidden.';
  });

  copy.addEventListener('click', async () => {
    copy.disabled = true;
    try {
      await navigator.clipboard.writeText(field.value);
      status.textContent = 'Secret copied. Paste it into LLD_COMMERCE_BRIDGE_SECRET in .env.local.';
    } catch {
      reveal(true);
      field.focus();
      field.select();
      field.setSelectionRange(0, field.value.length);
      status.textContent = 'Automatic copying is unavailable. The secret is selected: press Command+C on Mac or Ctrl+C on Windows, or use your device’s Copy action.';
    } finally {
      copy.disabled = false;
    }
  });
})();
