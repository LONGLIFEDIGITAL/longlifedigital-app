import { Box, Button, Container, Flex, Text, Title } from '@mantine/core';
import LDLogo from '../components/LDLogo';
export default function AboutPage({ contact, isAdmin, setContactForm, setShowContactEdit }) {
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
            About Us
          </Title>
          <Text component="p" inherit c="#9CA3AF" fz={15}>
            Our story, mission and values
          </Text>
        </Container>
      </Box>
      <Container size={800} p="60px 24px">
        <Box ta="center" mb={48}>
          <LDLogo size={72} />
          <Title
            order={2}
            c="#111827"
            fz="clamp(24px,4vw,36px)"
            fw="700"
            ff="'Playfair Display',serif"
            mt={20}
            mb={4}
          >
            Longlife Digital
          </Title>
          <Text component="p" inherit c="#6B7280" fz={16} lh={1.85}>
            Premium digital products for entrepreneurs, creators and learners
          </Text>
        </Box>
        {[
          [
            'Our Mission',
            'We believe that premium knowledge should be accessible to everyone ready to invest in themselves. Every product we create delivers real, measurable value.',
          ],
          [
            'What We Sell',
            'We offer a curated collection of ebooks, online courses, marketing tools, digital templates and premium domain names — all with instant delivery and lifetime access.',
          ],
          [
            'Our Promise',
            'Every product is handcrafted, tested and proven. We stand behind everything we sell with secure payments through Payhip and Stripe, fast support and a satisfaction guarantee.',
          ],
        ].map(([title, text]) => (
          <Box
            key={title}
            bg="#FAFAFA"
            mb={36}
            p="28px"
            style={{
              borderRadius: 12,
              border: '1px solid #F3F4F6',
            }}
          >
            <Title order={3} c="#1a0533" fz={20} fw="700" ff="'Playfair Display',serif" mb={12}>
              {title}
            </Title>
            <Text component="p" inherit c="#6B7280" lh={1.85}>
              {text}
            </Text>
          </Box>
        ))}
        <Box
          bg="#F3EEFF"
          p="28px"
          style={{
            borderRadius: 12,
            border: '1px solid rgba(147,51,234,0.15)',
          }}
        >
          <Flex align="center" justify="space-between" wrap="wrap" mb={16}>
            <Title order={3} c="#9333EA" fz={20} fw="700">
              Contact Us
            </Title>
            {isAdmin && (
              <Button
                className="btn-h"
                onClick={() => {
                  setContactForm(contact);
                  setShowContactEdit(true);
                }}
                variant="light"
                color="gray"
                px="lg"
                size="xs"
                type="button"
              >
                ✎ Edit Contact Info
              </Button>
            )}
          </Flex>
          <Text component="p" inherit c="#6B7280" mb={8}>
            📧 {contact.email}
          </Text>
          <Text component="p" inherit c="#6B7280" mb={8}>
            ◎ {contact.social}
          </Text>
          <Text component="p" inherit c="#6B7280">
            🌐 {contact.website}
          </Text>
        </Box>
      </Container>
    </div>
  );
}
