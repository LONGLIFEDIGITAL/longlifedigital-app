import ResponsiveModal from './ResponsiveModal';
import { ActionIcon, Box, Button, Flex, Input, Title } from '@mantine/core';
import LDLogo from './LDLogo';
export default function ContactEditor({
  contactForm,
  fire,
  setContact,
  setContactForm,
  setShowContactEdit,
}) {
  return (
    <ResponsiveModal
      onClose={() => setShowContactEdit(false)}
      size={440}
      zIndex={200}
      label="Edit contact details"
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        p={{
          base: 20,
          sm: 32,
        }}
        bg="#fff"
        pos="relative"
        style={{
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,0.15)',
        }}
      >
        <ActionIcon
          onClick={() => setShowContactEdit(false)}
          variant="transparent"
          color="dark"
          px={0}
          type="button"
          c="#374151"
          bg="#F9FAFB"
          fz={13}
          ff="'Inter',sans-serif"
          w={30}
          h={30}
          pos="absolute"
          top={14}
          right={14}
          style={{
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
          }}
          aria-label="Close dialog"
        >
          ✕
        </ActionIcon>
        <Flex align="center" gap={10} wrap="wrap" mb={22}>
          <LDLogo size={32} />
          <Title order={2} c="#111827" fz={20} fw="700" ff="'Playfair Display',serif">
            Edit Contact Info
          </Title>
        </Flex>
        <Box
          bg="#F9FAFB"
          mb={12}
          p="16px"
          style={{
            border: '1px solid #F3F4F6',
            borderRadius: 10,
          }}
        >
          <Box c="#111827" fz={13} fw="700" mb={12}>
            📞 Contact Details
          </Box>
          <Box
            component="label"
            c="#9CA3AF"
            fz={11}
            lts={1}
            tt="uppercase"
            mt={10}
            mb={5}
            style={{
              display: 'block',
            }}
          >
            Email Address
          </Box>
          <Input
            className="inp-f"
            value={contactForm.email}
            onChange={(e) =>
              setContactForm({
                ...contactForm,
                email: e.target.value,
              })
            }
          />
          <Box
            component="label"
            c="#9CA3AF"
            fz={11}
            lts={1}
            tt="uppercase"
            mt={10}
            mb={5}
            style={{
              display: 'block',
            }}
          >
            Phone Number
          </Box>
          <Input
            className="inp-f"
            value={contactForm.phone}
            onChange={(e) =>
              setContactForm({
                ...contactForm,
                phone: e.target.value,
              })
            }
          />
          <Box
            component="label"
            c="#9CA3AF"
            fz={11}
            lts={1}
            tt="uppercase"
            mt={10}
            mb={5}
            style={{
              display: 'block',
            }}
          >
            Social Media Handle
          </Box>
          <Input
            className="inp-f"
            value={contactForm.social}
            onChange={(e) =>
              setContactForm({
                ...contactForm,
                social: e.target.value,
              })
            }
          />
          <Box
            component="label"
            c="#9CA3AF"
            fz={11}
            lts={1}
            tt="uppercase"
            mt={10}
            mb={5}
            style={{
              display: 'block',
            }}
          >
            Website
          </Box>
          <Input
            className="inp-f"
            value={contactForm.website}
            onChange={(e) =>
              setContactForm({
                ...contactForm,
                website: e.target.value,
              })
            }
          />
        </Box>
        <Flex gap={12} wrap="wrap" mt={8}>
          <Button
            className="btn-h"
            onClick={() => {
              setContact(contactForm);
              setShowContactEdit(false);
              fire('✦ Contact info updated!');
            }}
            variant="filled"
            color="brand"
            px="lg"
            type="button"
            flex={1}
          >
            Save Changes
          </Button>
          <Button
            className="btn-h"
            onClick={() => setShowContactEdit(false)}
            variant="light"
            color="red"
            px="lg"
            type="button"
          >
            Cancel
          </Button>
        </Flex>
      </Box>
    </ResponsiveModal>
  );
}
