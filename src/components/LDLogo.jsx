import { Flex } from '@mantine/core';
export default function LDLogo({ size = 36, src, alt = 'Longlife Digital' }) {
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
        key={src}
        src={src || '/logo.png'}
        alt={alt}
        onError={(event) => {
          if (event.currentTarget.getAttribute('src') !== '/logo.png') {
            event.currentTarget.src = '/logo.png';
          }
        }}
        width={size}
        height={size}
        style={{
          display: 'block',
          objectFit: 'contain',
          width: '100%',
          height: '100%',
        }}
      />
    </Flex>
  );
}
