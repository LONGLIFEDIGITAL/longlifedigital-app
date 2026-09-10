import {
  Box,
  Button,
  Container,
  Flex,
  Input,
  NativeSelect,
  SimpleGrid,
  Text,
  Title,
} from '@mantine/core';
import { CATS } from '../constants/data';
import ProductCard from '../components/ProductCard';
export default function ShopPage({
  products,
  filtered,
  filterCat,
  setFilterCat,
  sortBy,
  setSortBy,
  isAdmin,
  openAdd,
  addCart,
  goProduct,
  fire,
  openEdit,
  openDel,
}) {
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
            All Products
          </Title>
          <Text component="p" inherit c="#9CA3AF" fz={15}>
            Discover our full collection of premium digital products
          </Text>
        </Container>
      </Box>
      <Container>
        <Box hiddenFrom="md" pt="lg">
          <NativeSelect
            label="Category"
            value={filterCat}
            onChange={(event) => setFilterCat(event.currentTarget.value)}
            data={CATS.map((cat) => ({
              value: cat.id,
              label: `${cat.icon} ${cat.lab}`,
            }))}
          />
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
            {CATS.map((cat) => (
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
                  {cat.lab}
                </Text>
                <Text component="span" inherit c="#9CA3AF" fz={11} ml="auto">
                  {cat.id === 'all'
                    ? products.length
                    : products.filter((p) => p.cat === cat.id).length}
                </Text>
              </Flex>
            ))}
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
            <Flex align="center" justify="space-between" wrap="wrap" mb={20}>
              <Text component="span" inherit c="#9CA3AF" fz={13}>
                {filtered.length} product{filtered.length !== 1 ? 's' : ''}
              </Text>
              <Input
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                component="select"
                styles={{
                  input: {
                    padding: '8px 14px',
                    color: '#374151',
                    cursor: 'pointer',
                  },
                }}
              >
                <option value="default">Sort by: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name: A-Z</option>
              </Input>
            </Flex>
            {filtered.length === 0 ? (
              <Box ta="center" p="60px 20px">
                <Text component="p" inherit c="#9CA3AF" fz={16}>
                  No products found.
                </Text>
              </Box>
            ) : (
              <SimpleGrid minColWidth="min(100%, 250px)" spacing={20}>
                {filtered.map((p) => (
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
        </Flex>
      </Container>
    </div>
  );
}
