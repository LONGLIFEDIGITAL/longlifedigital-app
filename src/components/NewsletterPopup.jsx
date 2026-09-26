import ResponsiveModal from './ResponsiveModal';
import { ActionIcon, Box, Button, Flex, Input, Text, Title } from '@mantine/core';
export default function NewsletterPopup({
  fire,
  newsletter,
  popupConsent,
  popupEmail,
  popupName,
  setPopupConsent,
  setPopupDone,
  setPopupEmail,
  setPopupName,
  setShowPopup,
  setSubscribed,
  setSubscribers,
}) {
  return (
    <ResponsiveModal
      onClose={() => {
        setShowPopup(false);
        setPopupDone(true);
      }}
      size={480}
      zIndex={400}
      label="Join the community"
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        bg="linear-gradient(135deg,#1a0533,#2d1066)"
        w="100%"
        maw={480}
        p="40px 36px"
        pos="relative"
        style={{
          border: '1px solid rgba(201,150,63,0.35)',
          borderRadius: '1.5rem',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        }}
      >
        <ActionIcon
          onClick={() => {
            setShowPopup(false);
            setPopupDone(true);
          }}
          variant="transparent"
          color="dark"
          px={0}
          type="button"
          c="rgba(255,255,255,0.6)"
          bg="rgba(255,255,255,0.1)"
          fz={16}
          w={32}
          h={32}
          pos="absolute"
          top={16}
          right={16}
          style={{
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
          }}
          aria-label="Close dialog"
        >
          ✕
        </ActionIcon>
        <Box
          bg="linear-gradient(90deg,#7C3AED,#C9963F,#E8C97A,#C9963F,#7C3AED)"
          h={3}
          pos="absolute"
          top={0}
          left={0}
          right={0}
          style={{
            borderRadius: '24px 24px 0 0',
          }}
        />
        <Box ta="center" mb={28}>
          <Box fz={44} mb={12}>
            🎁
          </Box>
          <Box c="#E8C97A" fz={10} lts={3} tt="uppercase" mb={10}></Box>
          <Title order={2} c="#fff" fz={28} fw={700} ff="'Plus Jakarta Sans',sans-serif" mb={8}>
            {newsletter.popup_heading || newsletter.heading || 'Newsletter'}
          </Title>
          <Text component="p" inherit c="#C084FC" fz={13} lh={1.75}>
            {newsletter.popup_body || newsletter.body}
          </Text>
        </Box>
        <Flex direction="column" gap={10} wrap="nowrap" mb={14}>
          <Input
            placeholder="Your first name..."
            value={popupName}
            onChange={(e) => setPopupName(e.target.value)}
            styles={{
              input: {
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '0.625rem',
                padding: '0.75rem 1rem',
                color: '#fff',
                fontFamily: "'Inter',sans-serif",
              },
            }}
          />
          <Input
            placeholder="Your email address..."
            value={popupEmail}
            onChange={(e) => setPopupEmail(e.target.value)}
            styles={{
              input: {
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '0.625rem',
                padding: '0.75rem 1rem',
                color: '#fff',
                fontFamily: "'Inter',sans-serif",
              },
            }}
          />
        </Flex>
        <Box
          component="label"
          mb={16}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={popupConsent}
            onChange={(e) => setPopupConsent(e.target.checked)}
            style={{
              marginTop: 3,
              width: '0.9375rem',
              height: '0.9375rem',
              accentColor: '#C9963F',
              flexShrink: 0,
            }}
          />
          <Text component="span" inherit c="rgba(255,255,255,0.55)" fz={11} lh={1.6}>
            {newsletter.consent_text}
          </Text>
        </Box>
        <Button
          className="btn-h"
          onClick={() => {
            if (!popupName.trim()) {
              fire('Please enter your name.', 'err');
              return;
            }
            if (!popupEmail.trim() || !popupEmail.includes('@')) {
              fire('Please enter a valid email.', 'err');
              return;
            }
            if (!popupConsent) {
              fire('Please check the consent box.', 'err');
              return;
            }
            setSubscribers((prev) => [
              ...prev,
              {
                name: popupName,
                email: popupEmail,
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
              },
            ]);
            setSubscribed(true);
            setPopupDone(true);
            setShowPopup(false);
            fire(newsletter.success_message || 'Thank you for subscribing.');
          }}
          variant="transparent"
          color="dark"
          px={0}
          type="button"
          c="#1a0533"
          bg="linear-gradient(135deg,#C9963F,#E8C97A)"
          fz={14}
          fw={700}
          ff="'Inter',sans-serif"
          w="100%"
          p="14px"
          style={{
            border: 'none',
            borderRadius: '0.625rem',
            cursor: 'pointer',
          }}
        >
          {newsletter.button_label || 'Subscribe'}
        </Button>
        <Text component="p" inherit c="rgba(255,255,255,0.3)" fz={11} ta="center" mt={10}></Text>
      </Box>
    </ResponsiveModal>
  );
}
