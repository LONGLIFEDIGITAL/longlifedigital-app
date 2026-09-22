import useContent from '../hooks/useContent';
import { PageHeader, ContentState, PageCta } from '../components/ContentPage';
import RichText from '../components/RichText';
import { Box, Button, Container, Flex, NativeSelect, Text } from '@mantine/core';
import CatalogStatus from '../components/CatalogStatus';
import { matchesCategory } from '../services/catalog';
import ProductCollection from '../components/ProductCollection';
import ProductGridSkeleton from '../components/skeletons/ProductGridSkeleton';
import CategorySkeleton from '../components/skeletons/CategorySkeleton';
import SkeletonBlock from '../components/skeletons/SkeletonBlock';
import SkeletonRegion from '../components/skeletons/SkeletonRegion';
export default function ShopPage({
  products,
  categories,
  catalogStatus,
  retryCatalog,
  filtered,
  filterCat,
  setFilterCat,
  sortBy,
  setSortBy,
  isAdmin,
  openAdd,
  addCart,
  goProduct,
  openEdit,
  openDel,
}) {
  const loading = catalogStatus === 'loading';
  const content = useContent('page', 'shop');
  return (
    <div>
      <PageHeader pageKey="shop" content={content.data} />
      <Container>
        <ContentState {...content} />
        {content.data?.body && <RichText html={content.data.body} />}
        <Box hiddenFrom="md" pt="lg">
          {loading ? (
            <CategorySkeleton variant="select" />
          ) : (
            <NativeSelect
              label="Category"
              value={filterCat}
              onChange={(event) => setFilterCat(event.currentTarget.value)}
              data={categories.map((cat) => ({
                value: cat.id,
                label: `${cat.icon} ${cat.label}`,
              }))}
            />
          )}
          {isAdmin && (
            <Button mt="sm" onClick={openAdd}>
              + Add Product
            </Button>
          )}
        </Box>
        <Flex
          align="stretch"
          gap={{
            base: 24,
            md: 40,
          }}
          wrap="wrap"
          direction={{
            base: 'column',
            md: 'row',
          }}
          p="32px 0 60px"
        >
          <Box
            visibleFrom="md"
            w={{
              base: '100%',
              md: 220,
            }}
            pos={{
              base: 'static',
              md: 'sticky',
            }}
            top={110}
            style={{
              flexShrink: 0,
            }}
          >
            <Box c="#111827" fz={13} fw="700" lts={1} tt="uppercase" mb={12}>
              Categories
            </Box>
            {loading ? (
              <CategorySkeleton />
            ) : (
              categories.map((cat) => (
                <Flex
                  key={cat.id}
                  className="btn-h"
                  onClick={() => setFilterCat(cat.id)}
                  align="center"
                  gap={8}
                  wrap="wrap"
                  c={filterCat === cat.id ? '#9333EA' : '#374151'}
                  bg={filterCat === cat.id ? '#F3EEFF' : 'transparent'}
                  fz={13}
                  fw={filterCat === cat.id ? '700' : '400'}
                  mb={4}
                  p="9px 12px"
                  style={{
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{cat.icon}</span>
                  <Text component="span" inherit flex={1}>
                    {cat.label}
                  </Text>
                  <Text component="span" inherit c="#9CA3AF" fz={11} ml="auto">
                    {cat.id === 'all'
                      ? products.length
                      : products.filter((p) => matchesCategory(p, cat.id)).length}
                  </Text>
                </Flex>
              ))
            )}
            {isAdmin && (
              <Button
                className="btn-h"
                onClick={openAdd}
                variant="filled"
                color="brand"
                px="lg"
                type="button"
                w="100%"
                mt={20}
              >
                + Add Product
              </Button>
            )}
          </Box>
          <Box flex={1}>
            <Flex align="center" justify="space-between" gap="sm" wrap="wrap" mb={20}>
              {loading ? (
                <SkeletonRegion label="Loading product count">
                  <SkeletonBlock height={20} width={80} />
                </SkeletonRegion>
              ) : (
                <Text component="span" inherit c="#9CA3AF" fz={13}>
                  {filtered.length} product{filtered.length !== 1 ? 's' : ''}
                </Text>
              )}
              <NativeSelect
                aria-label="Sort products"
                disabled={catalogStatus !== 'ready'}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                size="md"
                w={220}
                maw="100%"
                ml="auto"
              >
                <option value="default">Sort by: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name: A-Z</option>
              </NativeSelect>
            </Flex>
            {catalogStatus !== 'ready' ? (
              <CatalogStatus
                status={catalogStatus}
                retry={retryCatalog}
                loading={<ProductGridSkeleton label="Loading All Products" />}
              />
            ) : filtered.length === 0 ? (
              <Box ta="center" p="60px 20px">
                <Text component="p" inherit c="#9CA3AF" fz={16}>
                  No products found.
                </Text>
              </Box>
            ) : (
              <ProductCollection
                products={filtered}
                label="All Products"
                addCart={addCart}
                goProduct={goProduct}
                isAdmin={isAdmin}
                openEdit={openEdit}
                openDel={openDel}
              />
            )}
          </Box>
        </Flex>
        <PageCta cta={content.data?.cta} />
      </Container>
    </div>
  );
}
