import { Box, Button, Container, Flex, SimpleGrid, Text, Title } from '@mantine/core';
import { useState } from 'react';
const DOMAIN_LISTINGS = [
  {
    name: 'startup.io',
    cat: 'Premium',
    price: '$2,500',
    desc: '4-year aged premium .io domain. Perfect for tech startups. High recall, short and memorable.',
    badge: '🔥 Hot',
  },
  {
    name: 'AItools.co',
    cat: 'AI-Related',
    price: '$1,800',
    desc: 'Premium AI-focused domain perfect for AI product businesses and SaaS tools.',
    badge: '🤖 AI',
  },
  {
    name: 'MarketingPro.com',
    cat: 'Marketing',
    price: '$3,200',
    desc: 'Authoritative .com domain for marketing agencies and consultants. High SEO potential.',
    badge: '⭐ Premium',
  },
  {
    name: 'DenverHomes.co',
    cat: 'Real Estate',
    price: '$899',
    desc: 'Local real estate domain targeting Denver market. Great for agents and brokers.',
    badge: '🏠 Local',
  },
  {
    name: 'QuickBrand.io',
    cat: 'Brandable',
    price: '$650',
    desc: 'Catchy brandable domain suitable for any startup or new brand. Clean and memorable.',
    badge: '✦ Brandable',
  },
  {
    name: 'LocalBiz.co',
    cat: 'Local',
    price: '$750',
    desc: 'Versatile local business domain perfect for small business directories or agencies.',
    badge: '📍 Local',
  },
  {
    name: 'AIPrompts.co',
    cat: 'AI-Related',
    price: '$1,200',
    desc: 'Highly relevant domain for AI prompt businesses, marketplaces and digital products.',
    badge: '🤖 AI',
  },
  {
    name: 'SocialGrowth.com',
    cat: 'Marketing',
    price: '$2,100',
    desc: 'Premium marketing domain for social media agencies and growth consultants.',
    badge: '📈 Marketing',
  },
];
export default function DomainsPage({ setPage }) {
  const [domFilter, setDomFilter] = useState('All');
  const domCats = [
    'All',
    'Premium',
    'AI-Related',
    'Marketing',
    'Real Estate',
    'Brandable',
    'Local',
  ];
  const filteredDomains =
    domFilter === 'All' ? DOMAIN_LISTINGS : DOMAIN_LISTINGS.filter((d) => d.cat === domFilter);
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
            ✦ PREMIUM DOMAINS ✦
          </Box>
          <Title
            order={1}
            c="#111827"
            fz="clamp(28px,5vw,48px)"
            fw="700"
            ff="'Playfair Display',serif"
            mb={8}
          >
            Domains For Sale
          </Title>
          <Text component="p" inherit c="#9CA3AF" fz={15}>
            Premium, brandable and niche domains ready for immediate transfer
          </Text>
        </Container>
      </Box>
      <Container p="40px 24px 60px">
        <Flex gap={10} wrap="wrap" mb={36}>
          {domCats.map((cat) => (
            <Button
              key={cat}
              className="btn-h"
              onClick={() => setDomFilter(cat)}
              variant="transparent"
              color="dark"
              px={0}
              type="button"
              c={domFilter === cat ? '#9333EA' : '#9CA3AF'}
              bg={domFilter === cat ? 'rgba(147,51,234,0.06)' : '#fff'}
              fz={12}
              fw={600}
              ff="'Inter',sans-serif"
              p="7px 16px"
              style={{
                border: '1px solid #E8D5F5',
                borderRadius: 20,
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderColor: domFilter === cat ? '#9333EA' : '#E8D5F5',
              }}
            >
              {cat}
            </Button>
          ))}
        </Flex>
        <SimpleGrid minColWidth="min(100%, 300px)" spacing={24}>
          {filteredDomains.map((d, i) => (
            <Box
              key={i}
              bg="#fff"
              p="24px"
              pos="relative"
              style={{
                border: '1px solid #F3F4F6',
                borderRadius: 16,
                boxShadow: '0 4px 20px rgba(147,51,234,0.06)',
                overflow: 'hidden',
                transition: 'all 0.2s',
              }}
            >
              <Box
                bg="linear-gradient(90deg,#7C3AED,#C9963F,#E8C97A)"
                h={3}
                pos="absolute"
                top={0}
                left={0}
                right={0}
              />
              <Flex align="flex-start" justify="space-between" wrap="wrap" mb={12}>
                <Text
                  component="span"
                  inherit
                  c="#9333EA"
                  bg="rgba(147,51,234,0.08)"
                  fz={10}
                  fw={700}
                  p="3px 10px"
                  style={{
                    borderRadius: 20,
                  }}
                >
                  {d.cat}
                </Text>
                <Text
                  component="span"
                  inherit
                  c="#C9963F"
                  bg="rgba(201,150,63,0.1)"
                  fz={10}
                  fw={700}
                  p="3px 10px"
                  style={{
                    borderRadius: 20,
                  }}
                >
                  {d.badge}
                </Text>
              </Flex>
              <Box c="#1a0533" fz={22} fw={700} ff="'Playfair Display',serif" mb={8}>
                {d.name}
              </Box>
              <Text component="p" inherit c="#6B7280" fz={13} lh={1.65} mb={16}>
                {d.desc}
              </Text>
              <Flex align="center" justify="space-between" wrap="wrap">
                <Box c="#9333EA" fz={24} fw={700} ff="'Playfair Display',serif">
                  {d.price}
                </Box>
                <Button
                  className="btn-h"
                  onClick={() => setPage('contact')}
                  variant="filled"
                  color="brand"
                  px="lg"
                  type="button"
                >
                  Inquire →
                </Button>
              </Flex>
            </Box>
          ))}
        </SimpleGrid>
        <Box
          bg="linear-gradient(135deg,#1a0533,#2d1066)"
          mt={48}
          p="40px"
          style={{
            borderRadius: 20,
            border: '1px solid rgba(201,150,63,0.2)',
          }}
        >
          <Title order={3} c="#fff" fz={24} ff="'Playfair Display',serif" mb={10}>
            Have a Domain to Sell?
          </Title>
          <Text component="p" inherit c="#C084FC" fz={14} lh={1.75} mb={20}>
            We also purchase quality domains. If you own a premium domain and want to sell it,
            contact us for a valuation.
          </Text>
          <Button
            className="btn-h"
            onClick={() => setPage('contact')}
            variant="gradient"
            color="brand"
            px="lg"
            gradient={{
              from: '#C9963F',
              to: '#E8C97A',
              deg: 135,
            }}
            c="#1a0533"
            type="button"
          >
            Contact Us →
          </Button>
        </Box>
      </Container>
    </div>
  );
}
