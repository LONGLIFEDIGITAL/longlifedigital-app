import { Box } from '@mantine/core';
export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <Box
      role="status"
      aria-live="polite"
      maw="calc(100vw - 32px)"
      c="#fff"
      bg={toast.type === 'err' ? '#EF4444' : toast.type === 'info' ? '#F59E0B' : '#9333EA'}
      fz={13}
      fw="600"
      lts={0.3}
      p="11px 24px"
      pos="fixed"
      top={20}
      left="50%"
      style={{
        transform: 'translateX(-50%)',
        borderRadius: 8,
        zIndex: 9999,
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        overflowWrap: 'anywhere',
      }}
    >
      {toast.msg}
    </Box>
  );
}
