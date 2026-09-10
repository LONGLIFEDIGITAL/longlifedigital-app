import { Box, Container, SimpleGrid, Text, Title } from '@mantine/core';
import ProductCard from '../components/ProductCard';
export default function CoursesPage({
  products,
  addCart,
  goProduct,
  fire,
  isAdmin,
  openEdit,
  openDel,
}) {
  const courses = products.filter((p) => p.cat === 'course');
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
            ✦ LEARN & GROW ✦
          </Box>
          <Title
            order={1}
            c="#111827"
            fz="clamp(28px,5vw,48px)"
            fw="700"
            ff="'Playfair Display',serif"
            mb={8}
          >
            Courses
          </Title>
          <Text component="p" inherit c="#9CA3AF" fz={15}>
            Step-by-step courses to build skills and grow your income
          </Text>
        </Container>
      </Box>
      <Container p="60px 24px">
        {courses.length === 0 ? (
          <Box ta="center" p="60px 20px">
            <Text component="p" inherit c="#9CA3AF">
              Courses coming soon!
            </Text>
          </Box>
        ) : (
          <SimpleGrid minColWidth="min(100%, 250px)" spacing={20}>
            {courses.map((p) => (
              <ProductCard
                key={p.id}
                p={p}
                addCart={addCart}
                goProduct={goProduct}
                fire={fire}
                isAdmin={isAdmin}
                openEdit={openEdit}
                openDel={openDel}
              />
            ))}
          </SimpleGrid>
        )}
        <Box mt={48}>
          <Box c="#9333EA" fz={11} fw="600" lts={2} tt="uppercase" mb={8}>
            ✦ ALL DIGITAL PRODUCTS ✦
          </Box>
          <Title
            order={2}
            c="#111827"
            fz="clamp(24px,4vw,36px)"
            fw="700"
            ff="'Playfair Display',serif"
            mb={28}
          >
            Also Available
          </Title>
          <SimpleGrid minColWidth="min(100%, 250px)" spacing={20}>
            {products
              .filter((p) => p.cat !== 'course')
              .slice(0, 4)
              .map((p) => (
                <ProductCard
                  key={p.id}
                  p={p}
                  addCart={addCart}
                  goProduct={goProduct}
                  fire={fire}
                  isAdmin={isAdmin}
                  openEdit={openEdit}
                  openDel={openDel}
                />
              ))}
          </SimpleGrid>
        </Box>
      </Container>
    </div>
  );
}
