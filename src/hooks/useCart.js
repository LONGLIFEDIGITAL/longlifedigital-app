import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addCartItem, adjustCartQuantity, getQuantityLimits } from '../utils/cart';
import { cartProducts, commerce, headlessEnabled, readAttempt } from '../services/checkout';

export default function useCart(products) {
  const [local, setLocal] = useState([]);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const queue = useRef(Promise.resolve());
  const remote = useRef(null);
  const perform = useCallback((operation) => {
    // Serialize cart requests so rapid clicks cannot overwrite a newer Woo cart.
    const task = queue.current
      .catch(() => {})
      .then(async () => {
        setBusy(true);
        setError('');
        try {
          const next = await operation(remote.current);
          remote.current = next;
          setData(next);
          return next;
        } catch (e) {
          // Billing errors belong beside the form fields, not in the cart error banner.
          if (!Object.keys(e.fieldErrors || {}).length) setError(e.message);
          throw e;
        } finally {
          setBusy(false);
        }
      });
    queue.current = task;
    return task;
  }, []);
  const reload = useCallback(
    () => (headlessEnabled ? perform(() => commerce('cart')) : Promise.resolve()),
    [perform],
  );
  useEffect(() => {
    if (!headlessEnabled) return;
    const refresh = () => {
      // Stripe authentication can refocus the window after Woo has emptied a paid cart.
      // The confirmation page will refresh it after verifying the order.
      if (document.visibilityState === 'visible' && !readAttempt()?.pending)
        reload().catch(() => {});
    };
    refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [reload]);
  const mutate = useCallback((action, body) => perform(() => commerce(action, body)), [perform]);
  const add = async (product) => {
    if (!headlessEnabled) {
      setLocal((prev) => addCartItem(prev, product));
      return;
    }
    await perform(async (current) => {
      if (!current) await commerce('cart');
      return commerce('add', { id: product.id, quantity: getQuantityLimits(product).minimum });
    });
  };
  const remove = async (id) => {
    if (!headlessEnabled) {
      setLocal((prev) => prev.filter((p) => p.id !== id));
      return;
    }
    await perform((current) =>
      commerce('remove', { key: current.items.find((i) => i.id === id).key }),
    );
  };
  const change = async (id, direction) => {
    if (!headlessEnabled) {
      setLocal((prev) => adjustCartQuantity(prev, id, direction));
      return;
    }
    await perform((current) => {
      const item = current.items.find((i) => i.id === id);
      return commerce('update', {
        key: item.key,
        quantity: item.quantity + direction * (item.quantity_limits?.multiple_of || 1),
      });
    });
  };
  const clear = async () => {
    if (!headlessEnabled) {
      setLocal([]);
      return;
    }
    await perform(async (current) => {
      let next = current;
      for (const item of current.items) next = await commerce('remove', { key: item.key });
      return next;
    });
  };
  const cart = useMemo(
    () => (headlessEnabled ? cartProducts(data, products) : local),
    [data, products, local],
  );
  return { cart, data, busy, error, reload, mutate, add, remove, change, clear };
}
