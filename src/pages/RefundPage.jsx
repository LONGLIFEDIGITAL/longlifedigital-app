import { Box, Container, Text, Title } from '@mantine/core';
export default function RefundPage() {
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
            Refund Policy
          </Title>
          <Text component="p" inherit c="#9CA3AF" fz={15}>
            Last updated: January 2024
          </Text>
        </Container>
      </Box>
      <Container size={760} p="60px 24px">
        <Box
          bg="linear-gradient(135deg,#1a0533,#2d1066)"
          ta="center"
          mb={40}
          p="28px"
          style={{
            borderRadius: 16,
            border: '1px solid rgba(201,150,63,0.25)',
          }}
        >
          <Box fz={36} mb={12}>
            ⚠️
          </Box>
          <Title order={2} c="#fff" fz={24} ff="'Playfair Display',serif" mb={10}>
            All Sales Are Final
          </Title>
          <Text component="p" inherit c="#C084FC" fz={15} lh={1.75} maw={500} m="0 auto">
            Due to the digital nature of our products, all sales are final. We do not offer refunds
            on any digital products once the download link has been accessed or delivered.
          </Text>
        </Box>
        {[
          [
            'No Refund Policy on Digital Products',
            'All digital products sold by Longlife Digital — including ebooks, templates, prompt packs, planners, worksheets, PLR bundles and digital downloads — are non-refundable. Once a digital product has been purchased and the download link has been delivered, the sale is final and no refunds will be issued.',
          ],
          [
            'Why We Have This Policy',
            'Digital products are delivered instantly and cannot be returned. Unlike physical goods, digital files can be copied and retained even after a refund is issued. To protect the integrity of our products and business, we maintain a strict no-refund policy on all digital purchases.',
          ],
          [
            'Before You Purchase',
            'We strongly encourage all customers to read the full product description, review what is included and ensure the product meets your needs before completing your purchase. If you have questions about a product before buying, contact us at support@lldhome.com — we are happy to help you make the right decision.',
          ],
          [
            'Exceptions',
            'Refunds will only be considered in the following rare circumstances: (1) You were charged multiple times for the same order due to a technical error, or (2) You never received your download link due to a technical issue on our end. In these cases, contact us within 48 hours with proof of the issue.',
          ],
          [
            'Services',
            'Service-based offerings (website design, SEO, social media management, branding) are governed by a separate service agreement. Deposits are non-refundable once work has commenced. Please review your service agreement carefully before signing.',
          ],
          [
            'Domain Purchases',
            'Domain purchases are strictly non-refundable once the transfer process has been initiated. Please verify all domain details carefully before completing your purchase.',
          ],
          [
            'Contact Us Before Buying',
            'If you are unsure about a product, please reach out before purchasing. We would rather help you find the right product than have an unhappy customer. Email: support@lldhome.com',
          ],
        ].map(([title, body]) => (
          <Box
            key={title}
            bg="#FAFAFA"
            mb={28}
            p="24px"
            style={{
              borderRadius: 12,
              border: '1px solid #F3F4F6',
            }}
          >
            <Title order={3} c="#1a0533" fz={17} fw={700} ff="'Playfair Display',serif" mb={10}>
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
