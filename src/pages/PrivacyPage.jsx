import { Box, Container, Text, Title } from '@mantine/core';
export default function PrivacyPage() {
  return (
    <div>
      <Box
        py={{
          base: 32,
          sm: 40,
        }}
        bg="#F9FAFB"
        style={{
          borderBottom: '1px solid #F3F4F6',
        }}
      >
        <Container>
          <Title
            order={1}
            c="#111827"
            fz="clamp(28px,5vw,48px)"
            fw="700"
            ff="'Playfair Display',serif"
            mb={8}
          >
            Privacy Policy
          </Title>
          <Text component="p" inherit c="#9CA3AF" fz={15}>
            Last updated: January 2024
          </Text>
        </Container>
      </Box>
      <Container size={760} p="60px 24px">
        {[
          [
            'Information We Collect',
            'We collect information you provide when making a purchase (name, email, payment details), information collected automatically (IP address, browser type, pages visited) and information from payment processors (Payhip, Stripe, PayPal).',
          ],
          [
            'How We Use Your Information',
            'We use your information to process orders and deliver products, send purchase confirmations and product updates, respond to customer service requests, improve our products and services and send marketing emails (you may unsubscribe at any time).',
          ],
          [
            'Information Sharing',
            'We do not sell, trade or rent your personal information to third parties. We share information with payment processors (Payhip, Stripe, PayPal) to complete transactions and with email service providers to send communications.',
          ],
          [
            'Data Security',
            'We implement industry-standard security measures to protect your personal information. Payment information is handled by PCI-compliant processors and is never stored on our servers.',
          ],
          [
            'Cookies',
            'We use cookies to improve your browsing experience, analyze site traffic and personalize content. You can control cookie settings through your browser.',
          ],
          [
            'Your Rights',
            'You have the right to access, correct or delete your personal data at any time. Email support@lldhome.com to make any requests regarding your personal information.',
          ],
          ['Contact', 'Privacy questions: support@lldhome.com | longlifedigital.co'],
        ].map(([title, body]) => (
          <Box key={title} mb={28}>
            <Title order={3} c="#1a0533" fz={18} fw={700} ff="'Playfair Display',serif" mb={10}>
              {title}
            </Title>
            <Text component="p" inherit c="#6B7280" fz={14} lh={1.85}>
              {body}
            </Text>
          </Box>
        ))}
      </Container>
    </div>
  );
}
