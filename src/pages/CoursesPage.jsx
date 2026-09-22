import useContent from '../hooks/useContent';
import { PageHeader, ContentState, PageCta } from '../components/ContentPage';
import RichText from '../components/RichText';
import { Box, Container, SimpleGrid, Text, Title } from '@mantine/core';
import ProductCard from '../components/ProductCard';
import CatalogStatus from '../components/CatalogStatus';
import ProductGridSkeleton from '../components/skeletons/ProductGridSkeleton';
import { matchesCategory } from '../services/catalog';
export default function CoursesPage({
  products,
  catalogStatus,
  retryCatalog,
  addCart,
  goProduct,
  fire,
  isAdmin,
  openEdit,
  openDel,
}) {
  const courses = products.filter((p) => matchesCategory(p, 'course'));
  const content = useContent('page', 'courses');
  return (
    <div>
      <PageHeader pageKey="courses" content={content.data} />
      <Container p="60px 24px">
        <ContentState {...content} />
        {content.data?.body && <RichText html={content.data.body} />}
        {catalogStatus !== 'ready' ? (
          <CatalogStatus
            status={catalogStatus}
            retry={retryCatalog}
            loading={<ProductGridSkeleton label="Loading courses" compactMobile={false} />}
          />
        ) : courses.length === 0 ? (
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
          {catalogStatus === 'loading' ? (
            <ProductGridSkeleton label="Loading other products" compactMobile={false} />
          ) : (
            <SimpleGrid minColWidth="min(100%, 250px)" spacing={20}>
              {products
                .filter((p) => !matchesCategory(p, 'course'))
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
          )}
        </Box>
        <PageCta cta={content.data?.cta} />
      </Container>
    </div>
  );
}
