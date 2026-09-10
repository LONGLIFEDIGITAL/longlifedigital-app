import { Box, Button, Container, Flex, Input, SimpleGrid, Text, Title } from '@mantine/core';
import { CATS, BLOG_POSTS } from '../constants/data';
import LDLogo from '../components/LDLogo';
import ProductCard from '../components/ProductCard';
import classes from './HomePage.module.css';
export default function HomePage({
  products,
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
  contact,
}) {
  return (
    <div>
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
            <Text
              component="p"
              inherit
              c="#E8C97A"
              bg="rgba(201,150,63,0.12)"
              fz={13}
              fw="600"
              lts={2}
              tt="uppercase"
              mb={20}
              p="5px 16px"
              style={{
                border: '1px solid rgba(201,150,63,0.3)',
                borderRadius: 30,
                display: 'inline-block',
              }}
            >
              ✦ Premium Digital Products
            </Text>
            <Title
              order={1}
              c="#ffffff"
              fz="clamp(32px,5vw,64px)"
              fw="700"
              ff="'Playfair Display',serif"
              lh={1.1}
              mb={20}
            >
              Beautifully Crafted
              <br />
              <Text component="span" inherit className={classes.gradientText}>
                Digital Products
              </Text>
              <br />
              for Life & Business
            </Title>
            <Text
              component="p"
              inherit
              c="rgba(255,255,255,0.72)"
              fz={16}
              lh={1.85}
              maw={480}
              mb={32}
            >
              Instant download ebooks, courses, marketing tools and premium domains — everything you
              need to grow online.
            </Text>
            <Flex
              gap={12}
              wrap="wrap"
              direction={{
                base: 'column',
                xs: 'row',
              }}
              align="stretch"
            >
              <Button
                className="btn-h"
                onClick={() => setPage('shop')}
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
                fz={15}
                p="14px 32px"
              >
                Shop Now
              </Button>
              <Button
                className="btn-h"
                onClick={() => setPage('about')}
                variant="transparent"
                color="dark"
                type="button"
                c="#fff"
                bg="rgba(255,255,255,0.08)"
                fz={15}
                fw={600}
                p="14px 20px"
                style={{
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                }}
              >
                Learn More
              </Button>
            </Flex>
            <Flex gap={24} wrap="wrap" mt={32}>
              {[
                ['500+', 'Happy Customers'],
                ['11+', 'Digital Products'],
                ['4.9★', 'Avg Rating'],
              ].map(([val, lbl]) => (
                <Box key={lbl} ta="center">
                  <Box c="#E8C97A" fz={20} fw={800} ff="'Playfair Display',serif">
                    {val}
                  </Box>
                  <Box c="rgba(255,255,255,0.45)" fz={11} mt={2}>
                    {lbl}
                  </Box>
                </Box>
              ))}
            </Flex>
          </Box>
          <Box miw={0}>
            <Box
              bg="rgba(255,255,255,0.06)"
              p="24px"
              style={{
                borderRadius: 16,
                boxShadow: '0 24px 80px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(24px)',
              }}
            >
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
                ⭐ Best Seller
              </Box>
              <Box
                fz={56}
                mb={12}
                style={{
                  display: 'block',
                }}
              >
                🚀
              </Box>
              <Box c="#fff" fz={18} fw="700" ff="'Playfair Display',serif" lh={1.3} mb={12}>
                AI Wealth Accelerator Bundle
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
                  $497
                </Text>
                <Text component="span" inherit c="rgba(255,255,255,0.35)" fz={16} td="line-through">
                  $997
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
                  Save 50%
                </Text>
              </Flex>
              <Box fz={13} mb={4}>
                <Text component="span" inherit c="#F59E0B">
                  ★★★★★
                </Text>{' '}
                <Text component="span" inherit c="rgba(255,255,255,0.5)" fz={12}>
                  4.9 (128 reviews)
                </Text>
              </Box>
              <Button
                className="btn-h"
                onClick={() => goProduct(products[0])}
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
        <Flex justify="center" gap={16} wrap="wrap" maw={1280} m="0 auto">
          {CATS.filter((c) => c.id !== 'all').map((cat) => (
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
                {products.filter((p) => p.cat === cat.id).length} items
              </Text>
            </Flex>
          ))}
        </Flex>
      </Box>
      <Box
        py={{
          base: 32,
          sm: 64,
        }}
        component="section"
      >
        <Container>
          <Flex align="flex-end" justify="space-between" gap={12} wrap="wrap" mb={32}>
            <div>
              <Title
                order={2}
                c="#111827"
                fz="clamp(24px,4vw,36px)"
                fw="700"
                ff="'Playfair Display',serif"
                mb={4}
              >
                Featured Products
              </Title>
              <Text component="p" inherit c="#9CA3AF" fz={14}>
                Handpicked for quality and results
              </Text>
            </div>
            <Button
              className="btn-h"
              onClick={() => setPage('shop')}
              variant="outline"
              color="brand"
              px="lg"
              type="button"
            >
              View All →
            </Button>
          </Flex>
          <SimpleGrid minColWidth="min(100%, 260px)" spacing={20}>
            {products
              .filter((p) => p.featured)
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
      <Box bg="linear-gradient(135deg,#9333EA,#7C3AED)" p="32px 24px">
        <Flex align="center" justify="space-between" gap={20} wrap="wrap" maw={1280} m="0 auto">
          <div>
            <Title order={3} c="#fff" fz={22} fw="700" ff="'Playfair Display',serif" mb={6}>
              🔥 Limited Time Offer
            </Title>
            <Text component="p" inherit c="rgba(255,255,255,0.85)" fz={15}>
              AI Wealth Accelerator Bundle — 50% off. Was $997, now just $497.
            </Text>
          </div>
          <Button
            className="btn-h"
            onClick={() => goProduct(products[0])}
            variant="transparent"
            color="dark"
            px={0}
            type="button"
            c="#9333EA"
            bg="#fff"
            fz={14}
            fw="700"
            ff="'Inter',sans-serif"
            p="13px 28px"
            style={{
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Shop This Deal
          </Button>
        </Flex>
      </Box>
      <Box
        py={{
          base: 32,
          sm: 64,
        }}
        bg="#FAFAFA"
        component="section"
      >
        <Container>
          <Flex align="flex-end" justify="space-between" gap={12} wrap="wrap" mb={32}>
            <div>
              <Title
                order={2}
                c="#111827"
                fz="clamp(24px,4vw,36px)"
                fw="700"
                ff="'Playfair Display',serif"
                mb={4}
              >
                Best-Selling Products
              </Title>
              <Text component="p" inherit c="#9CA3AF" fz={14}>
                Our most loved digital products
              </Text>
            </div>
            <Button
              className="btn-h"
              onClick={() => setPage('shop')}
              variant="outline"
              color="brand"
              px="lg"
              type="button"
            >
              View All →
            </Button>
          </Flex>
          <SimpleGrid minColWidth="min(100%, 260px)" spacing={20}>
            {[...products]
              .sort((a, b) => b.reviews - a.reviews)
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
        </Container>
      </Box>
      <Box
        bg="#F9FAFB"
        p="40px 24px"
        style={{
          borderTop: '1px solid #F3F4F6',
        }}
      >
        <SimpleGrid minColWidth="min(100%, 160px)" spacing={24} maw={1280} m="0 auto">
          {[
            ['⚡', 'Instant Delivery', 'Download immediately after purchase'],
            ['🔒', 'Secure Payments', 'Protected by Payhip & Stripe'],
            ['♾️', 'Lifetime Access', 'Buy once, yours forever'],
            ['💬', '24hr Support', 'We reply within 24 hours'],
            ['⭐', '5-Star Rated', 'Loved by thousands of customers'],
            ['🌍', 'Global Store', 'Serving customers worldwide'],
          ].map(([icon, title, desc]) => (
            <Box key={title} ta="center">
              <Text
                component="span"
                inherit
                fz={28}
                mb={8}
                style={{
                  display: 'block',
                }}
              >
                {icon}
              </Text>
              <Box c="#111827" fz={13} fw="700" mb={4}>
                {title}
              </Box>
              <Box c="#9CA3AF" fz={11} lh={1.5}>
                {desc}
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
      <Box
        py={{
          base: 32,
          sm: 64,
        }}
        component="section"
      >
        <Container>
          <Flex align="flex-end" justify="space-between" gap={12} wrap="wrap" mb={32}>
            <div>
              <Title
                order={2}
                c="#111827"
                fz="clamp(24px,4vw,36px)"
                fw="700"
                ff="'Playfair Display',serif"
                mb={4}
              >
                Blog Posts
              </Title>
              <Text component="p" inherit c="#9CA3AF" fz={14}>
                Tips, guides and strategies to grow your business
              </Text>
            </div>
            <Button
              className="btn-h"
              onClick={() => setPage('blog')}
              variant="outline"
              color="brand"
              px="lg"
              type="button"
            >
              View All →
            </Button>
          </Flex>
          <SimpleGrid minColWidth="min(100%, 300px)" spacing={24}>
            {BLOG_POSTS.map((post) => (
              <Box
                key={post.id}
                className="pcard"
                bg="#fff"
                style={{
                  border: '1px solid #F3F4F6',
                  borderRadius: 12,
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                <Flex
                  align="center"
                  justify="center"
                  wrap="wrap"
                  bg="linear-gradient(135deg,#F3EEFF,#EDE9FE)"
                  h={160}
                >
                  <Text component="span" inherit fz={48}>
                    {post.img}
                  </Text>
                </Flex>
                <Box p="20px">
                  <Text
                    component="span"
                    inherit
                    c="#9333EA"
                    bg="#F3EEFF"
                    fz={11}
                    fw="600"
                    mb={8}
                    p="3px 10px"
                    style={{
                      borderRadius: 20,
                      display: 'inline-block',
                    }}
                  >
                    {post.tag}
                  </Text>
                  <Box c="#9CA3AF" fz={12} mb={10}>
                    {post.date}
                  </Box>
                  <Title
                    order={3}
                    c="#111827"
                    fz={16}
                    fw="700"
                    ff="'Playfair Display',serif"
                    lh={1.4}
                    mb={10}
                  >
                    {post.title}
                  </Title>
                  <Text component="p" inherit c="#6B7280" fz={13} lh={1.65} mb={14}>
                    {post.excerpt}
                  </Text>
                  <Button
                    className="btn-h"
                    variant="transparent"
                    color="dark"
                    px={0}
                    type="button"
                    c="#9333EA"
                    bg="none"
                    fz={13}
                    fw="600"
                    ff="'Inter',sans-serif"
                    p={0}
                    style={{
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Read More →
                  </Button>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>
      <Box
        py={{
          base: 32,
          sm: 64,
        }}
        bg="#F9F7FF"
        component="section"
      >
        <Container>
          <SimpleGrid
            cols={{
              base: 1,
              md: 2,
            }}
            spacing={{
              base: 24,
              md: 56,
            }}
            style={{
              alignItems: 'center',
            }}
          >
            <Flex
              align="center"
              direction="column"
              gap={24}
              wrap="nowrap"
              bg="#F3EEFF"
              ta="center"
              p="40px 24px"
              style={{
                borderRadius: 20,
              }}
            >
              <LDLogo size={80} />
              <SimpleGrid cols={2} spacing={16} w="100%">
                {[
                  ['6+', 'Product Categories'],
                  ['500+', 'AI Prompts'],
                  ['24hr', 'Support'],
                  ['100%', 'Digital'],
                ].map(([v, l]) => (
                  <Box
                    key={l}
                    bg="#fff"
                    ta="center"
                    p="14px"
                    style={{
                      borderRadius: 10,
                    }}
                  >
                    <Box c="#9333EA" fz={22} fw="700" ff="'Playfair Display',serif">
                      {v}
                    </Box>
                    <Box c="#9CA3AF" fz={10} mt={2}>
                      {l}
                    </Box>
                  </Box>
                ))}
              </SimpleGrid>
            </Flex>
            <div>
              <Text
                component="p"
                inherit
                c="#9333EA"
                fz={11}
                fw="600"
                lts={2}
                tt="uppercase"
                mb={8}
              >
                WHO ARE WE?
              </Text>
              <Title
                order={2}
                c="#111827"
                fz="clamp(24px,4vw,36px)"
                fw="700"
                ff="'Playfair Display',serif"
                mb={4}
              >
                About Longlife Digital
              </Title>
              <Text component="p" inherit c="#6B7280" fz={15} lh={1.85} mb={16}>
                At Longlife Digital, we believe that powerful knowledge tools should be accessible,
                impactful, and incredibly easy to use. We are more than just a digital product shop
                — we are a trusted partner for entrepreneurs, creators and learners worldwide.
              </Text>
              <Text component="p" inherit c="#6B7280" fz={15} lh={1.85} mb={16}>
                Every product we create is built on three principles: <strong>real value</strong>,{' '}
                <strong>professional quality</strong>, and <strong>actionable results</strong>. We
                stand behind everything we sell.
              </Text>
              <Box m="20px 0">
                {[
                  ['✓ Pre-built and ready to use', '✓ No subscriptions — one-time purchase'],
                  ['✓ Instant digital delivery', '✓ Lifetime access included free'],
                ].map((row, i) => (
                  <Flex key={i} gap={16} wrap="wrap" mb={8}>
                    {row.map((f) => (
                      <Text key={f} component="span" inherit c="#374151" fz={13} fw="500">
                        {f}
                      </Text>
                    ))}
                  </Flex>
                ))}
              </Box>
              <Button
                className="btn-h"
                onClick={() => setPage('about')}
                variant="filled"
                color="brand"
                px="lg"
                type="button"
              >
                Learn More →
              </Button>
            </div>
          </SimpleGrid>
        </Container>
      </Box>
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
          <Title order={2} c="#fff" fz="clamp(22px,4vw,36px)" ff="'Playfair Display',serif" mb={10}>
            Get News, Offers & Free Resources
          </Title>
          <Text component="p" inherit c="rgba(255,255,255,0.7)" fz={14} mb={28}>
            Exclusive deals, new products and free tips — straight to your inbox.
          </Text>
          {subscribed ? (
            <Box c="#E8C97A" fz={18} fw={700}>
              ✦ You're subscribed! Welcome aboard.
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
                  Yes! I want news, offers and free resources from Longlife Digital. I can
                  unsubscribe anytime.{' '}
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
                  fire('Welcome ' + subName + '! ✦');
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
                ✦ Subscribe — It's Free
              </Button>
              <Text component="p" inherit c="rgba(255,255,255,0.3)" fz={10} ta="center" mt={10}>
                🔒 No spam. Unsubscribe anytime.
              </Text>
            </Box>
          )}
        </Container>
      </Box>
      <Box bg="#111827" component="footer">
        <Box p="48px 24px 36px">
          <Container>
            <SimpleGrid
              cols={{
                base: 1,
                xs: 2,
                md: 4,
              }}
              spacing={{
                base: 24,
                md: 40,
              }}
              maw={1280}
              m="0 auto"
            >
              <div>
                <Flex align="center" gap={10} wrap="wrap" mb={14}>
                  <LDLogo size={32} />
                  <div>
                    <Box c="#fff" fz={15} fw="700" ff="'Playfair Display',serif">
                      Longlife Digital
                    </Box>
                    <Box c="#9CA3AF" fz={11}>
                      longlifedigital.co
                    </Box>
                  </div>
                </Flex>
                <Text component="p" inherit c="#6B7280" fz={13} lh={1.7} mb={16}>
                  Premium digital products for entrepreneurs, creators and learners. Excellence in
                  every product.
                </Text>
                <Flex gap={12} wrap="wrap">
                  {['Facebook', 'Instagram', 'TikTok', 'YouTube'].map((sn) => (
                    <Text
                      key={sn}
                      component="span"
                      inherit
                      c="#6B7280"
                      fz={12}
                      style={{
                        cursor: 'pointer',
                      }}
                    >
                      {sn}
                    </Text>
                  ))}
                </Flex>
              </div>
              <div>
                <Box c="#9CA3AF" fz={12} fw="700" lts={1} tt="uppercase" mb={14}>
                  Shop
                </Box>
                {CATS.filter((c) => c.id !== 'all').map((cat) => (
                  <Box
                    key={cat.id}
                    className="nav-a"
                    onClick={() => {
                      setFilterCat(cat.id);
                      setPage('shop');
                    }}
                    c="#6B7280"
                    fz={13}
                    mb={10}
                    style={{
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                    }}
                  >
                    {cat.label}
                  </Box>
                ))}
              </div>
              <div>
                <Box c="#9CA3AF" fz={12} fw="700" lts={1} tt="uppercase" mb={14}>
                  Company
                </Box>
                {[
                  ['About', 'about'],
                  ['Blog', 'blog'],
                  ['Shop', 'shop'],
                ].map(([l, id]) => (
                  <Box
                    key={id}
                    className="nav-a"
                    onClick={() => setPage(id)}
                    c="#6B7280"
                    fz={13}
                    mb={10}
                    style={{
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                    }}
                  >
                    {l}
                  </Box>
                ))}
                <Box
                  c="#6B7280"
                  fz={13}
                  mb={10}
                  style={{
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                >
                  Contact Us
                </Box>
              </div>
              <div>
                <Box c="#9CA3AF" fz={12} fw="700" lts={1} tt="uppercase" mb={14}>
                  Support
                </Box>
                {[
                  ['FAQ', 'faq'],
                  ['Refund Policy', 'refund'],
                  ['Privacy Policy', 'privacy'],
                  ['Terms of Service', 'terms'],
                  ['Contact Us', 'contact'],
                ].map(([l, pg]) => (
                  <Box
                    key={l}
                    className="nav-a"
                    onClick={() => setPage(pg)}
                    c="#6B7280"
                    fz={13}
                    mb={10}
                    style={{
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                    }}
                  >
                    {l}
                  </Box>
                ))}
                <Box mt={16}>
                  <Box c="#9CA3AF" fz={12} fw="700" lts={1} tt="uppercase" mb={14}>
                    Contact
                  </Box>
                  <a
                    href={'mailto:' + contact.email}
                    style={{
                      fontSize: 13,
                      color: '#6B7280',
                      cursor: 'pointer',
                      marginBottom: 10,
                      transition: 'color 0.2s',
                      textDecoration: 'none',
                      display: 'block',
                    }}
                  >
                    📧 {contact.email}
                  </a>
                </Box>
              </div>
            </SimpleGrid>
          </Container>
        </Box>
        <Box
          p="18px 24px"
          style={{
            borderTop: '1px solid #1F2937',
          }}
        >
          <Container>
            <Flex
              align="center"
              justify="space-between"
              gap={12}
              wrap="wrap"
              c="#4B5563"
              fz={12}
              maw={1280}
              m="0 auto"
            >
              <span>© 2024 Longlife Digital · longlifedigital.co</span>
              <Flex gap={8} wrap="wrap">
                {['Visa', 'Mastercard', 'PayPal', 'Stripe', 'Apple Pay'].map((p) => (
                  <Text
                    key={p}
                    component="span"
                    inherit
                    c="#9CA3AF"
                    bg="#1F2937"
                    fz={11}
                    p="4px 8px"
                    style={{
                      borderRadius: 4,
                    }}
                  >
                    {p}
                  </Text>
                ))}
              </Flex>
              <Flex gap={16} wrap="wrap">
                {['Refund Policy', 'Privacy Policy', 'Terms'].map((l) => (
                  <Text
                    key={l}
                    component="span"
                    inherit
                    c="#6B7280"
                    fz={11}
                    mb={10}
                    style={{
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                    }}
                  >
                    {l}
                  </Text>
                ))}
              </Flex>
            </Flex>
          </Container>
        </Box>
      </Box>
    </div>
  );
}
