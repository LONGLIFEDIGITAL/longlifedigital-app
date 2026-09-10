import { Box, Container, Text, Title } from '@mantine/core';
export default function TermsPage() {
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
            Terms of Service
          </Title>
          <Text component="p" inherit c="#9CA3AF" fz={15}>
            Last updated: January 2024
          </Text>
        </Container>
      </Box>
      <Container size={760} p="60px 24px">
        {[
          [
            'Agreement',
            'By accessing or using longlifedigital.co, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not use our services.',
          ],
          [
            'Products and Services',
            'Longlife Digital sells digital products including ebooks, templates, prompt packs and courses, as well as business services. All digital products are delivered electronically after payment.',
          ],
          [
            'Intellectual Property',
            'All products sold by Longlife Digital are protected by copyright law. Unless otherwise stated (e.g. PLR products), products are for personal use only and may not be resold, redistributed or shared.',
          ],
          [
            'PLR Licenses',
            'Products marked with PLR (Private Label Rights) may be rebranded and resold subject to the specific license included with the product. Reselling the PLR rights themselves is prohibited.',
          ],
          [
            'Payment',
            'All prices are in USD. We use Payhip and Stripe for secure payment processing. By completing a purchase you authorize the charge to your payment method.',
          ],
          [
            'Disclaimer',
            'Products are provided for educational and informational purposes. Results vary and are not guaranteed. Longlife Digital makes no warranty about income or business results from using our products.',
          ],
          [
            'Limitation of Liability',
            'Longlife Digital shall not be liable for any indirect, incidental or consequential damages arising from use of our products or services, to the maximum extent permitted by law.',
          ],
          [
            'Changes',
            'We reserve the right to modify these terms at any time. Continued use of our website after changes constitutes acceptance of the new terms.',
          ],
          ['Contact', 'Terms questions: support@lldhome.com'],
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
