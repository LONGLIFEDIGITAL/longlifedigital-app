import PageMetadata from '../components/PageMetadata';
import { Box, Button, Container, Flex, Input, SimpleGrid, Text, Title } from '@mantine/core';
import LoadingImage from '../components/LoadingImage';
import HomeHeroContent from '../components/HomeHeroContent';
import HomeEditorial, { EditorialStatistics, SectionHeading } from '../components/HomeEditorial';
import useHomeHero from '../hooks/useHomeHero';
import { fmtPrice, getProdTheme, stars } from '../utils/helpers';
import { matchesCategory } from '../services/catalog';
import CatalogStatus from '../components/CatalogStatus';
import ProductCollection from '../components/ProductCollection';
import FeaturedProductSkeleton from '../components/skeletons/FeaturedProductSkeleton';
import CategorySkeleton from '../components/skeletons/CategorySkeleton';
import SkeletonBlock from '../components/skeletons/SkeletonBlock';
import SkeletonRegion from '../components/skeletons/SkeletonRegion';
import classes from './HomePage.module.css';
export default function HomePage({
  settings,
  products,
  categories,
  catalogStatus,
  retryCatalog,
  cmsManaged,
  setPage,
  setFilterCat,
  goProduct,
  addCart,
  fire,
  isAdmin,
  openAdd,
  openEdit,
  openDel,
  subName,
  setSubName,
  subEmail,
  setSubEmail,
  subConsent,
  setSubConsent,
  subscribed,
  setSubscribed,
  setSubscribers,
}) {
  const { brand } = settings;
  const newsletter = settings.newsletter;
  const { content, status: contentStatus, managed: contentManaged } = useHomeHero();
  const collection =
    content?.collections?.[products.some((product) => product.featured) ? 'featured' : 'catalog'];
  const more =
    !contentManaged && !cmsManaged
      ? { title: 'Best-Selling Products', intro: 'Our most loved digital products' }
      : content?.collections?.more;
  const loading = catalogStatus === 'loading';
  const featured = products.filter((product) => product.featured);
  const highlighted = featured[0] || products[0];
  const saleProduct = products.find((product) => product.oldPrice);
  const homeProducts = featured.length ? featured : products;
  const money = (product, amount = product.price) =>
    fmtPrice(amount, product.currency, product.minorUnit);
  return (
    <div>
      <PageMetadata content={content} title={brand.name} path="/" />
      <Flex
        align="center"
        wrap="wrap"
        py={{
          base: 40,
          sm: 64,
          lg: 80,
        }}
        px={{
          base: 16,
          sm: 24,
        }}
        bg="linear-gradient(135deg,#0a001e 0%,#1a0533 35%,#2d0f6b 65%,#1a0533 100%)"
        mih="70vh"
        pos="relative"
        component="section"
        style={{
          overflow: 'hidden',
        }}
      >
        {/* Glowing orbs */}
        <Box
          bg="radial-gradient(circle,rgba(147,51,234,0.35) 0%,transparent 70%)"
          w="700px"
          h="700px"
          pos="absolute"
          top="-250px"
          right="-150px"
          style={{
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <Box
          bg="radial-gradient(circle,rgba(201,150,63,0.18) 0%,transparent 70%)"
          w="500px"
          h="500px"
          pos="absolute"
          left="-100px"
          bottom="-200px"
          style={{
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <Box
          bg="radial-gradient(circle,rgba(147,51,234,0.12) 0%,transparent 70%)"
          w="350px"
          h="350px"
          pos="absolute"
          top="30%"
          left="35%"
          style={{
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        {/* Gold top bar */}
        <Box
          bg="linear-gradient(90deg,#7C3AED,#C9963F,#E8C97A,#C9963F,#7C3AED)"
          h="3px"
          pos="absolute"
          top={0}
          left={0}
          right={0}
          style={{
            pointerEvents: 'none',
          }}
        />
        {/* Subtle grid overlay */}
        <Box
          pos="absolute"
          style={{
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
            backgroundSize: '60px 60px',
            pointerEvents: 'none',
          }}
        />
        <SimpleGrid
          cols={{
            base: 1,
            md: 2,
          }}
          spacing={{
            base: 32,
            lg: 60,
          }}
          w="100%"
          maw={1280}
          m="0 auto"
          pos="relative"
          style={{
            zIndex: 1,
            alignItems: 'center',
          }}
        >
          <Box miw={0}>
            <HomeHeroContent website={brand.website} />
            <EditorialStatistics items={content?.heroStats} light />
            <Flex gap={24} wrap="wrap" mt={32}>
              {(cmsManaged
                ? [[String(products.length), 'Digital Products']]
                : [
                    ['500+', 'Happy Customers'],
                    ['11+', 'Digital Products'],
                    ['4.9★', 'Avg Rating'],
                  ]
              ).map(([val, lbl]) => (
                <Box key={lbl} ta="center">
                  <Box c="#E8C97A" fz={20} fw={800} ff="'Playfair Display',serif">
                    {loading ? (
                      <SkeletonRegion label="Loading product count">
                        <SkeletonBlock tone="light" height={25} width={48} mx="auto" />
                      </SkeletonRegion>
                    ) : (
                      val
                    )}
                  </Box>
                  <Box c="rgba(255,255,255,0.45)" fz={11} mt={2}>
                    {lbl}
                  </Box>
                </Box>
              ))}
            </Flex>
          </Box>
          <Box miw={0}>
            {highlighted ? (
              <Box
                className={classes.featuredCard}
                data-with-image={highlighted.image ? true : undefined}
              >
                {highlighted.image && (
                  <LoadingImage
                    className={classes.featuredImage}
                    src={highlighted.image}
                    alt=""
                    aria-hidden="true"
                  />
                )}
                <Box className={classes.featuredContent}>
                  <Box
                    c="#E8C97A"
                    bg="rgba(201,150,63,0.2)"
                    fz={11}
                    fw="700"
                    mb={16}
                    p="4px 12px"
                    style={{
                      borderRadius: 20,
                      display: 'inline-block',
                      border: '1px solid rgba(201,150,63,0.4)',
                    }}
                  >
                    {highlighted.tag ||
                      (highlighted.featured ? 'Featured Product' : 'Explore Our Products')}
                  </Box>
                  <Box
                    className={highlighted.image ? classes.featuredImageSpace : undefined}
                    aria-hidden="true"
                    fz={56}
                    mb={12}
                  >
                    {!highlighted.image && getProdTheme(highlighted.id).icon}
                  </Box>
                  <Box c="#fff" fz={18} fw="700" ff="'Playfair Display',serif" lh={1.3} mb={12}>
                    {highlighted.name}
                  </Box>
                  <Flex align="center" gap={10} wrap="wrap" mb={10}>
                    <Text
                      component="span"
                      inherit
                      c="#E8C97A"
                      fz={28}
                      fw="700"
                      ff="'Playfair Display',serif"
                    >
                      {money(highlighted)}
                    </Text>
                    {highlighted.oldPrice && (
                      <>
                        <Text
                          component="span"
                          inherit
                          c="rgba(255,255,255,0.7)"
                          fz={16}
                          td="line-through"
                        >
                          {money(highlighted, highlighted.oldPrice)}
                        </Text>
                        <Text
                          component="span"
                          inherit
                          c="#92400E"
                          bg="#FEF3C7"
                          fz={11}
                          fw="700"
                          p="3px 10px"
                          style={{
                            borderRadius: 20,
                          }}
                        >
                          Save {Math.round((1 - highlighted.price / highlighted.oldPrice) * 100)}%
                        </Text>
                      </>
                    )}
                  </Flex>
                  {highlighted.reviews > 0 && (
                    <Box fz={13} mb={4}>
                      <Text component="span" inherit c="#F59E0B">
                        {stars(highlighted.rating)}
                      </Text>{' '}
                      <Text component="span" inherit c="rgba(255,255,255,0.5)" fz={12}>
                        {highlighted.rating} ({highlighted.reviews} reviews)
                      </Text>
                    </Box>
                  )}
                  <Button
                    className="btn-h"
                    onClick={() => goProduct(highlighted)}
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
                    w="100%"
                    mt={12}
                  >
                    View Details →
                  </Button>
                </Box>
              </Box>
            ) : (
              <CatalogStatus
                status={catalogStatus}
                retry={retryCatalog}
                empty
                loading={<FeaturedProductSkeleton />}
              />
            )}
          </Box>
        </SimpleGrid>
      </Flex>
      <Box
        bg="#fff"
        p="24px"
        style={{
          borderTop: '1px solid #F3F4F6',
          borderBottom: '1px solid #F3F4F6',
        }}
      >
        {loading ? (
          <CategorySkeleton variant="tiles" label="Loading product categories" />
        ) : (
          <Flex justify="center" gap={16} wrap="wrap" maw={1280} m="0 auto">
            {categories
              .filter((c) => c.id !== 'all')
              .map((cat) => (
                <Flex
                  key={cat.id}
                  className="btn-h"
                  onClick={() => {
                    setFilterCat(cat.id);
                    setPage('shop');
                  }}
                  align="center"
                  direction="column"
                  gap={4}
                  wrap="nowrap"
                  bg="#fff"
                  miw={100}
                  p="16px 20px"
                  style={{
                    border: '1px solid #F3F4F6',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Text
                    component="span"
                    inherit
                    fz={28}
                    mb={6}
                    style={{
                      display: 'block',
                    }}
                  >
                    {cat.icon}
                  </Text>
                  <Text component="span" inherit c="#374151" fz={12} fw="600">
                    {cat.label}
                  </Text>
                  <Text component="span" inherit c="#9CA3AF" fz={10}>
                    {products.filter((p) => matchesCategory(p, cat.id)).length} items
                  </Text>
                </Flex>
              ))}
          </Flex>
        )}
      </Box>
      <Box
        py={{
          base: 32,
          sm: 64,
        }}
        component="section"
      >
        <Container>
          <SectionHeading
            title={collection?.title}
            intro={collection?.intro}
            cta={content?.collections?.cta}
            website={brand.website}
            loading={contentStatus === 'loading'}
          />
          <ProductCollection
            products={homeProducts}
            loading={loading}
            label={collection?.title || 'Products'}
            desktopLimit={featured.length ? undefined : 4}
            minColWidth={260}
            addCart={addCart}
            goProduct={goProduct}
            isAdmin={isAdmin}
            openEdit={openEdit}
            openDel={openDel}
          />
          {isAdmin && (
            <Box ta="center" mt={28}>
              <Button
                className="btn-h"
                onClick={openAdd}
                variant="filled"
                color="brand"
                px="lg"
                type="button"
              >
                + Add Product
              </Button>
            </Box>
          )}
        </Container>
      </Box>
      {saleProduct && content?.offer?.title && (
        <Box bg="linear-gradient(135deg,#9333EA,#7C3AED)" p="32px 24px">
          <Flex align="center" justify="space-between" gap={20} wrap="wrap" maw={1280} m="0 auto">
            <div>
              <Title order={3} c="#fff" fz={22} fw="700" ff="'Playfair Display',serif" mb={6}>
                {content.offer.title}
              </Title>
              <Text component="p" inherit c="rgba(255,255,255,0.85)" fz={15}>
                {saleProduct.name} — Was {money(saleProduct, saleProduct.oldPrice)}, now{' '}
                {money(saleProduct)}.
              </Text>
            </div>
            {content.offer.button && (
              <Button
                className="btn-h"
                onClick={() => goProduct(saleProduct)}
                variant="transparent"
                color="dark"
                type="button"
                c="#9333EA"
                bg="#fff"
                fz={14}
                fw="700"
                ff="'Inter',sans-serif"
                p="13px 20px"
                style={{
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {content.offer.button}
              </Button>
            )}
          </Flex>
        </Box>
      )}
      <Box
        py={{
          base: 32,
          sm: 64,
        }}
        bg="#FAFAFA"
        component="section"
      >
        <Container>
          <SectionHeading
            title={more?.title}
            intro={more?.intro}
            cta={content?.collections?.cta}
            website={brand.website}
            loading={contentStatus === 'loading'}
          />
          <ProductCollection
            products={[...products].sort((a, b) => b.reviews - a.reviews)}
            loading={loading}
            label={more?.title || 'More products'}
            desktopLimit={4}
            minColWidth={260}
            addCart={addCart}
            goProduct={goProduct}
            isAdmin={isAdmin}
            openEdit={openEdit}
            openDel={openDel}
          />
        </Container>
      </Box>
      <HomeEditorial
        content={content}
        status={contentStatus}
        products={products}
        catalogStatus={catalogStatus}
        brand={brand}
      />
      {newsletter?.enabled && (
        <Box
          py={{
            base: 32,
            sm: 64,
          }}
          bg="linear-gradient(135deg,#1a0533,#2d1066)"
          component="section"
        >
          <Container size={600} ta="center">
            <Box c="#E8C97A" fz={10} lts={3} tt="uppercase" mb={10}>
              ✦ JOIN THE COMMUNITY ✦
            </Box>
            <Title
              order={2}
              c="#fff"
              fz="clamp(22px,4vw,36px)"
              ff="'Playfair Display',serif"
              mb={10}
            >
              {newsletter.heading || 'Newsletter'}
            </Title>
            <Text component="p" inherit c="rgba(255,255,255,0.7)" fz={14} mb={28}>
              {newsletter.body}
            </Text>
            {subscribed ? (
              <Box c="#E8C97A" fz={18} fw={700}>
                {newsletter.success_message || 'Thank you for subscribing.'}
              </Box>
            ) : (
              <Box
                bg="rgba(255,255,255,0.06)"
                p="24px"
                style={{
                  border: '1px solid rgba(201,150,63,0.25)',
                  borderRadius: 14,
                }}
              >
                <SimpleGrid
                  cols={{
                    base: 1,
                    sm: 2,
                  }}
                  spacing={10}
                  mb={10}
                >
                  <div>
                    <Box
                      component="label"
                      c="#E8C97A"
                      fz={10}
                      lts={2}
                      mb={5}
                      style={{
                        display: 'block',
                      }}
                    >
                      FIRST NAME *
                    </Box>
                    <Input
                      placeholder="e.g. John"
                      value={subName}
                      onChange={(e) => setSubName(e.target.value)}
                      styles={{
                        input: {
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          padding: '10px 12px',
                          color: '#fff',
                        },
                      }}
                    />
                  </div>
                  <div>
                    <Box
                      component="label"
                      c="#E8C97A"
                      fz={10}
                      lts={2}
                      mb={5}
                      style={{
                        display: 'block',
                      }}
                    >
                      EMAIL *
                    </Box>
                    <Input
                      placeholder="e.g. john@email.com"
                      value={subEmail}
                      onChange={(e) => setSubEmail(e.target.value)}
                      styles={{
                        input: {
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          padding: '10px 12px',
                          color: '#fff',
                        },
                      }}
                    />
                  </div>
                </SimpleGrid>
                <Box
                  component="label"
                  ta="left"
                  mb={16}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={subConsent}
                    onChange={(e) => setSubConsent(e.target.checked)}
                    style={{
                      marginTop: 2,
                      width: 15,
                      height: 15,
                      accentColor: '#C9963F',
                      flexShrink: 0,
                    }}
                  />
                  <Text component="span" inherit c="rgba(255,255,255,0.6)" fz={11} lh={1.6}>
                    {newsletter.consent_text}{' '}
                    <Text
                      onClick={() => setPage('privacy')}
                      component="span"
                      inherit
                      c="#E8C97A"
                      style={{
                        cursor: 'pointer',
                      }}
                    >
                      Privacy Policy
                    </Text>
                    .
                  </Text>
                </Box>
                <Button
                  className="btn-h"
                  onClick={() => {
                    if (!subName.trim()) {
                      fire('Enter your name', 'err');
                      return;
                    }
                    if (!subEmail.includes('@')) {
                      fire('Enter valid email', 'err');
                      return;
                    }
                    if (!subConsent) {
                      fire('Please check consent box', 'err');
                      return;
                    }
                    setSubscribers((p) => [
                      ...p,
                      {
                        name: subName,
                        email: subEmail,
                        date: new Date().toLocaleDateString(),
                        time: new Date().toLocaleTimeString(),
                      },
                    ]);
                    setSubscribed(true);
                    setSubName('');
                    setSubEmail('');
                    setSubConsent(false);
                    fire(newsletter.success_message || 'Thank you for subscribing.');
                  }}
                  variant="transparent"
                  color="dark"
                  px={0}
                  type="button"
                  c="#1a0533"
                  bg="linear-gradient(135deg,#C9963F,#E8C97A)"
                  fz={13}
                  fw={700}
                  w="100%"
                  p="12px"
                  style={{
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  {newsletter.button_label || 'Subscribe'}
                </Button>
                <Text
                  component="p"
                  inherit
                  c="rgba(255,255,255,0.3)"
                  fz={10}
                  ta="center"
                  mt={10}
                ></Text>
              </Box>
            )}
          </Container>
        </Box>
      )}
    </div>
  );
}
