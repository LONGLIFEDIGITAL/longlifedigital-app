import { Flex } from '@mantine/core';
export default function LDLogo({ size = 36 }) {
  return (
    <Flex
      align="center"
      justify="center"
      wrap="wrap"
      bg="#1a0533"
      w={size}
      h={size}
      style={{
        borderRadius: 10,
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: '0 0 0 1px rgba(147,51,234,0.3)',
      }}
    >
      <img
        src="/logo.png"
        alt="Longlife Digital"
        width={size}
        height={size}
        style={{
          display: 'block',
          objectFit: 'contain',
        }}
      />
    </Flex>
  );
}
