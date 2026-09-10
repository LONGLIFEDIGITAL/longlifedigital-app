import { Box, Button, Container, Flex, Text, Title } from '@mantine/core';
import { useState } from 'react';
export default function FAQPage({ setPage }) {
  const [open, setOpen] = useState(null);
  const faqs = [
    {
      q: 'How do I download my product?',
      a: 'After purchase you receive an email with a download link. Payhip delivers your file automatically within seconds.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all major credit cards, PayPal, Apple Pay and Google Pay via Payhip or Stripe.',
    },
    {
      q: 'Can I get a refund?',
      a: 'All digital product sales are final. Please read the description carefully before purchasing. Contact us at support@lldhome.com with any questions before buying.',
    },
    {
      q: 'Do I need special software?',
      a: 'Most products are PDF files. Templates may require Canva (free) or Microsoft Word.',
    },
    {
      q: 'Can I share or resell your products?',
      a: 'Standard products are for personal use only. PLR products can be rebranded and resold per the included license.',
    },
    {
      q: 'I lost my download link?',
      a: 'Email support@lldhome.com with your order email and we will resend it within 24 hours.',
    },
    {
      q: 'Do you offer discounts?',
      a: 'Yes! Use code WELCOME10 for 10% off your first order. Follow @longlifedigital for more codes.',
    },
    {
      q: 'How do I contact support?',
      a: 'Email support@lldhome.com. We reply within 24 hours Mon-Sat.',
    },
  ];
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
          <Box c="#9333EA" fz={11} fw="600" lts={2} tt="uppercase" mb={8}>
            ✦ FAQ ✦
          </Box>
          <Title
            order={1}
            c="#111827"
            fz="clamp(28px,5vw,48px)"
            fw="700"
            ff="'Playfair Display',serif"
            mb={8}
          >
            Frequently Asked Questions
          </Title>
          <Text component="p" inherit c="#9CA3AF" fz={15}>
            Everything you need to know about Longlife Digital
          </Text>
        </Container>
      </Box>
      <Container size={760} p="60px 24px">
        {faqs.map((faq, i) => (
          <Box
            key={i}
            mb={12}
            style={{
              border: '1px solid #F3F4F6',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: open === i ? '0 4px 20px rgba(147,51,234,0.08)' : 'none',
            }}
          >
            <Flex
              className="btn-h"
              onClick={() => setOpen(open === i ? null : i)}
              align="center"
              justify="space-between"
              wrap="wrap"
              bg={open === i ? '#F3EEFF' : '#fff'}
              p="18px 20px"
              style={{
                cursor: 'pointer',
              }}
            >
              <Text component="span" inherit c="#1a0533" fz={15} fw={600}>
                {faq.q}
              </Text>
              <Text
                component="span"
                inherit
                c="#9333EA"
                fz={18}
                fw={700}
                ml={12}
                style={{
                  flexShrink: 0,
                }}
              >
                {open === i ? '−' : '+'}
              </Text>
            </Flex>
            {open === i && (
              <Box
                c="#6B7280"
                bg="#fff"
                fz={14}
                lh={1.8}
                p="0 20px 18px"
                style={{
                  borderTop: '1px solid #F3F4F6',
                }}
              >
                {faq.a}
              </Box>
            )}
          </Box>
        ))}
        <Box
          bg="#F3EEFF"
          ta="center"
          mt={40}
          p="32px"
          style={{
            borderRadius: 16,
            border: '1px solid rgba(147,51,234,0.15)',
          }}
        >
          <Text component="p" inherit c="#6B7280" fz={15} mb={16}>
            Still have questions?
          </Text>
          <Button
            className="btn-h"
            onClick={() => setPage('contact')}
            variant="filled"
            color="brand"
            px="lg"
            type="button"
          >
            Contact Us →
          </Button>
        </Box>
      </Container>
    </div>
  );
}
