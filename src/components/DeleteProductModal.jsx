import ResponsiveModal from './ResponsiveModal';
import { Box, Button, Flex, Text, Title } from '@mantine/core';
export default function DeleteProductModal({ delId, delProduct, setDelId }) {
  return (
    <ResponsiveModal onClose={() => setDelId(null)} size={340} zIndex={200} label="Delete product">
      <Box
        onClick={(e) => e.stopPropagation()}
        p={{
          base: 20,
          sm: 32,
        }}
        bg="#fff"
        ta="center"
        pos="relative"
        style={{
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,0.15)',
        }}
      >
        <Box fz={40} mb={12}>
          ⚠️
        </Box>
        <Title order={3} c="#111827" fz={20} fw="700" ff="'Plus Jakarta Sans',sans-serif">
          Delete this product?
        </Title>
        <Text component="p" inherit c="#9CA3AF" fz={13} mb={24}>
          This cannot be undone.
        </Text>
        <Flex justify="center" gap={12} wrap="wrap">
          <Button
            className="btn-h"
            onClick={() => setDelId(null)}
            variant="filled"
            color="brand"
            px="lg"
            type="button"
          >
            Cancel
          </Button>
          <Button
            className="btn-h"
            onClick={() => delProduct(delId)}
            variant="light"
            color="red"
            px="lg"
            type="button"
          >
            Delete
          </Button>
        </Flex>
      </Box>
    </ResponsiveModal>
  );
}
