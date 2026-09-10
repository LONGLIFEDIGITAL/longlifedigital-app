import { Box, Button, Container, Flex, SimpleGrid, Text, Title } from '@mantine/core';
export default function ServicesPage({ setPage }) {
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
            ✦ WHAT WE OFFER ✦
          </Box>
          <Title
            order={1}
            c="#111827"
            fz="clamp(28px,5vw,48px)"
            fw="700"
            ff="'Playfair Display',serif"
            mb={8}
          >
            Our Services
          </Title>
          <Text component="p" inherit c="#9CA3AF" fz={15}>
            Professional digital services to grow your business online
          </Text>
        </Container>
      </Box>
      <Container p="60px 24px">
        <SimpleGrid
          minColWidth="min(100%, 300px)"
          spacing={{
            base: 24,
            md: 28,
          }}
        >
          {[
            {
              icon: '🤝',
              title: 'Affiliate Marketing',
              price: 'From $299/mo',
              desc: 'We set up and manage your affiliate program. Get other people promoting your products and services.',
            },
            {
              icon: '🔍',
              title: 'SEO Services',
              price: 'From $499/mo',
              desc: 'Complete SEO strategy to rank your website #1 on Google. Keyword research, on-page and off-page optimization.',
            },
            {
              icon: '🏢',
              title: 'LLC Formation Assistance',
              price: 'From $199',
              desc: 'We guide you through forming your LLC step by step. Business name search, articles of organization and more.',
            },
            {
              icon: '💻',
              title: 'Website Design',
              price: 'From $799',
              desc: 'Custom professional websites built to convert visitors into customers. Mobile-first, fast and beautiful.',
            },
            {
              icon: '📱',
              title: 'Social Media Management',
              price: 'From $399/mo',
              desc: 'Full social media management for Instagram, Facebook, TikTok and LinkedIn. Content creation and scheduling.',
            },
            {
              icon: '📍',
              title: 'Google Business Optimization',
              price: 'From $299',
              desc: 'Optimize your Google Business Profile to dominate local search. Photos, posts, reviews and more.',
            },
            {
              icon: '📣',
              title: 'Facebook & Google Ads',
              price: 'From $499/mo',
              desc: 'Results-driven paid advertising on Facebook, Instagram and Google. Ad creation, targeting and management.',
            },
            {
              icon: '🤖',
              title: 'AI Automation Services',
              price: 'From $599',
              desc: 'Automate repetitive business tasks using AI tools. Email automation, chatbot setup and workflow systems.',
            },
            {
              icon: '🎨',
              title: 'Branding & Graphic Design',
              price: 'From $399',
              desc: 'Professional brand identity including logo design, color palette, typography and brand guidelines.',
            },
            {
              icon: '📦',
              title: 'Digital Product Creation',
              price: 'From $299',
              desc: 'We create your digital products for you. Ebooks, courses, templates, prompt packs and more.',
            },
          ].map((svc, i) => (
            <Box
              key={i}
              bg="#fff"
              p="28px"
              pos="relative"
              style={{
                border: '1px solid #F3F4F6',
                borderRadius: 16,
                boxShadow: '0 4px 20px rgba(147,51,234,0.06)',
                transition: 'all 0.2s',
                overflow: 'hidden',
              }}
            >
              <Flex
                align="center"
                justify="center"
                wrap="wrap"
                bg="#F3EEFF"
                fz={24}
                w={52}
                h={52}
                mb={16}
                style={{
                  borderRadius: 12,
                }}
              >
                {svc.icon}
              </Flex>
              <Title order={3} c="#1a0533" fz={17} fw={700} ff="'Playfair Display',serif" mb={6}>
                {svc.title}
              </Title>
              <Box
                c="#9333EA"
                bg="rgba(147,51,234,0.08)"
                fz={13}
                fw={700}
                mb={12}
                p="3px 10px"
                style={{
                  borderRadius: 20,
                  display: 'inline-block',
                }}
              >
                {svc.price}
              </Box>
              <Text component="p" inherit c="#6B7280" fz={13} lh={1.7}>
                {svc.desc}
              </Text>
              <Button
                className="btn-h"
                onClick={() => setPage('contact')}
                variant="filled"
                color="brand"
                px="lg"
                type="button"
                w="100%"
                mt={16}
              >
                Get Started →
              </Button>
            </Box>
          ))}
        </SimpleGrid>
        <Box
          bg="#F3EEFF"
          ta="center"
          mt={56}
          p="40px"
          style={{
            borderRadius: 20,
            border: '1px solid rgba(147,51,234,0.15)',
          }}
        >
          <Title order={2} c="#1a0533" fz={28} ff="'Playfair Display',serif" mb={12}>
            Not Sure Which Service You Need?
          </Title>
          <Text component="p" inherit c="#6B7280" fz={15} lh={1.75} mb={24}>
            Book a free 15-minute consultation call and we will recommend the best strategy for your
            business.
          </Text>
          <Button
            className="btn-h"
            onClick={() => setPage('contact')}
            variant="filled"
            color="brand"
            px="lg"
            type="button"
          >
            Book Free Consultation →
          </Button>
        </Box>
      </Container>
    </div>
  );
}
