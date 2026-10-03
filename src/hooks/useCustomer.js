import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountRequest } from '../services/account';
import { headlessEnabled } from '../services/checkout';

const key = ['customer', 'session'];
export default function useCustomer() {
  const client = useQueryClient();
  const session = useQuery({
    queryKey: key,
    queryFn: () => accountRequest('session'),
    enabled: headlessEnabled,
    networkMode: 'always',
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: 'always',
  });
  useEffect(() => {
    if (!headlessEnabled || !globalThis.BroadcastChannel) return;
    const channel = new BroadcastChannel('lld-account');
    channel.onmessage = () => {
      client.removeQueries({ queryKey: ['customer', 'orders'] });
      client.removeQueries({ queryKey: ['customer', 'downloads'] });
      client.invalidateQueries({ queryKey: key });
    };
    return () => channel.close();
  }, [client]);
  const mutation = useMutation({
    // A form submission must resolve or fail, not pause indefinitely while the
    // browser considers itself offline (including localhost without internet).
    networkMode: 'always',
    retry: false,
    mutationFn: ({ action, body }) => accountRequest(action, body),
    onSuccess: async (data, { action }) => {
      if (!['login', 'logout', 'reset'].includes(action)) return;
      await client.cancelQueries({ queryKey: ['customer'] });
      client.removeQueries({ queryKey: ['customer', 'orders'] });
      client.removeQueries({ queryKey: ['customer', 'downloads'] });
      client.setQueryData(key, { user: data.user || null });
      if (globalThis.BroadcastChannel) {
        const channel = new BroadcastChannel('lld-account');
        channel.postMessage('changed');
        channel.close();
      }
    },
    onError: (_error, { action }) => {
      // The API clears the browser cookie even if WP logout cannot be reached.
      if (action === 'logout') {
        client.invalidateQueries({ queryKey: key });
        client.removeQueries({ queryKey: ['customer', 'orders'] });
        client.removeQueries({ queryKey: ['customer', 'downloads'] });
      }
    },
  });
  return {
    user: session.data?.user || null,
    loading: headlessEnabled && session.isPending,
    error: session.error,
    retry: session.refetch,
    busy: mutation.isPending,
    submit: (action, body) => mutation.mutateAsync({ action, body }),
  };
}
