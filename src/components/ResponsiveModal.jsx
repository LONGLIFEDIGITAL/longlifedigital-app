import { Modal } from '@mantine/core';

// Each caller owns its existing open/close state and form handlers.
export default function ResponsiveModal({ children, onClose, size = 540, label, zIndex = 400 }) {
  return (
    <Modal.Root
      opened
      onClose={onClose}
      size={size}
      centered
      padding={0}
      zIndex={zIndex}
      classNames={{
        content: 'responsive-modal',
        body: 'responsive-modal-body',
      }}
    >
      <Modal.Overlay backgroundOpacity={0.65} blur={6} />
      <Modal.Content aria-label={label}>
        <Modal.Body>{children}</Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
