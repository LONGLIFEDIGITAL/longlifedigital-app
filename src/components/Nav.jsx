import {
  ActionIcon,
  Box,
  Burger,
  Button,
  Container,
  Drawer,
  Flex,
  Group,
  Indicator,
  Menu,
  NavLink,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { useResizeObserver } from '@mantine/hooks';
import LDLogo from './LDLogo';
import classes from './Nav.module.css';
const SERVICES = [
  {
    icon: '🤝',
    label: 'Affiliate Marketing',
    desc: 'Earn commissions promoting top products',
  },
  {
    icon: '🔍',
    label: 'SEO',
    desc: 'Rank higher on Google organically',
  },
  {
    icon: '🏢',
    label: 'LLC Formation Assistance',
    desc: 'Start your business the right way',
  },
  {
    icon: '💻',
    label: 'Website Design',
    desc: 'Custom professional websites built for you',
  },
  {
    icon: '📱',
    label: 'Social Media Management',
    desc: 'Grow your audience consistently',
  },
  {
    icon: '📍',
    label: 'Google Business Optimization',
    desc: 'Dominate local search results',
  },
  {
    icon: '📣',
    label: 'Facebook & Google Ads',
    desc: 'Paid advertising that converts',
  },
  {
    icon: '🤖',
    label: 'AI Automation Services',
    desc: 'Automate repetitive tasks with AI',
  },
  {
    icon: '🎨',
    label: 'Branding & Graphic Design',
    desc: 'Premium brand identity design',
  },
  {
    icon: '📦',
    label: 'Digital Product Creation',
    desc: 'We create your digital products for you',
  },
];
const DOMAIN_CATS = [
  {
    icon: '⭐',
    label: 'Premium Domains',
    desc: 'High-value short & memorable domains',
  },
  {
    icon: '🏷️',
    label: 'Brandable Domains',
    desc: 'Perfect for startups and new brands',
  },
  {
    icon: '📍',
    label: 'Local Business Domains',
    desc: 'City and region-specific domains',
  },
  {
    icon: '🤖',
    label: 'AI-Related Domains',
    desc: 'Future-proof AI and tech domains',
  },
  {
    icon: '📈',
    label: 'Marketing Domains',
    desc: 'High-converting niche domains',
  },
  {
    icon: '🏠',
    label: 'Real Estate Domains',
    desc: 'Premium property and realtor domains',
  },
];
const LINKS = [
  ['home', 'Home'],
  ['services', 'Services'],
  ['courses', 'Courses'],
  ['domains', 'Domains'],
  ['shop', 'Digital Products'],
  ['about', 'About'],
  ['contact', 'Contact'],
];
export default function Nav({
  page,
  setPage,
  annBarHidden,
  scrolled,
  search,
  setSearch,
  setFilterCat,
  isAdmin,
  logout,
  setShowLogin,
  setShowDashboard,
  cart,
  setShowCart,
  menuOpen,
  setMenuOpen,
  activeDropdown,
  setActiveDropdown,
}) {
  const [headerRef, headerRect] = useResizeObserver();
  const [announcementRef, announcementRect] = useResizeObserver();
  const navigate = (id) => {
    setPage(id);
    setMenuOpen(false);
    setActiveDropdown(null);
  };
  const updateSearch = (e) => {
    setSearch(e.target.value);
    if (e.target.value) {
      setFilterCat('all');
      setPage('shop');
    }
  };
  return (
    <>
      <Box
        component="header"
        ref={headerRef}
        className={classes.header}
        data-scrolled={scrolled || undefined}
        style={{
          transform: annBarHidden ? `translateY(-${announcementRect.height}px)` : 'translateY(0)',
        }}
      >
        <Box ref={announcementRef} className={classes.announcement} px="md" py={8}>
          <Text size="xs" ta="center" c="white" lh={1.6}>
            🎉 Get <strong>10% off</strong> your first order — Code: <strong>WELCOME10</strong>
            <Text component="span" visibleFrom="sm" inherit>
              | ⚡ Instant Digital Delivery | 📧 support@lldhome.com
            </Text>
          </Text>
        </Box>
        <Container size={1440} py={10}>
          <Flex
            component="nav"
            aria-label="Main navigation"
            align="center"
            gap={{
              base: 8,
              sm: 16,
            }}
            wrap="nowrap"
          >
            <UnstyledButton
              className={classes.brand}
              onClick={() => navigate('home')}
              aria-label="Longlife Digital home"
            >
              <Group gap={10} wrap="nowrap">
                <LDLogo size={36} />
                <Box miw={0}>
                  <Text
                    className={classes.brandName}
                    fz={{
                      base: 14,
                      sm: 16,
                    }}
                  >
                    Longlife Digital
                  </Text>
                  <Text className={classes.brandSubtitle} visibleFrom="sm">
                    Premium Digital Store
                  </Text>
                </Box>
              </Group>
            </UnstyledButton>
            <Group visibleFrom="xl" gap={4} wrap="nowrap" ml="auto">
              {LINKS.map(([id, label]) => {
                const items = id === 'services' ? SERVICES : id === 'domains' ? DOMAIN_CATS : null;
                if (!items)
                  return (
                    <Button
                      key={id}
                      variant="subtle"
                      size="sm"
                      px={10}
                      color={page === id ? 'brand' : 'dark'}
                      aria-current={page === id ? 'page' : undefined}
                      onClick={() => navigate(id)}
                    >
                      {label}
                    </Button>
                  );
                return (
                  <Menu
                    key={id}
                    trigger="click-hover"
                    opened={activeDropdown === id}
                    onChange={(opened) => setActiveDropdown(opened ? id : null)}
                    position="bottom"
                    width={560}
                    shadow="lg"
                    withinPortal
                    zIndex={150}
                  >
                    <Menu.Target>
                      <Button
                        variant="subtle"
                        size="sm"
                        px={10}
                        aria-label={label}
                        color={page === id ? 'brand' : 'dark'}
                        rightSection="▾"
                        aria-current={page === id ? 'page' : undefined}
                      >
                        {label}
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label>
                        {id === 'services' ? 'Our Services' : 'Domains For Sale'}
                      </Menu.Label>
                      <SimpleGrid cols={2} spacing={4}>
                        {items.map((item) => (
                          <Menu.Item
                            key={item.label}
                            leftSection={<Text size="xl">{item.icon}</Text>}
                            onClick={() => navigate(id)}
                          >
                            <Text size="sm" fw={600}>
                              {item.label}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {item.desc}
                            </Text>
                          </Menu.Item>
                        ))}
                      </SimpleGrid>
                      <Menu.Divider />
                      <Menu.Item ta="center" c="brand" fw={700} onClick={() => navigate(id)}>
                        {id === 'services' ? 'View All Services →' : 'Browse All Domains →'}
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                );
              })}
            </Group>
            <Group
              gap={{
                base: 6,
                sm: 10,
              }}
              wrap="nowrap"
              ml="auto"
            >
              <TextInput
                visibleFrom="sm"
                w={{
                  sm: 180,
                  lg: 210,
                }}
                aria-label="Search products"
                placeholder="Search products..."
                leftSection="⌕"
                value={search}
                onChange={updateSearch}
              />
              {isAdmin ? (
                <>
                  <ActionIcon
                    size="lg"
                    variant="light"
                    onClick={() => setShowDashboard(true)}
                    aria-label="Open dashboard"
                    title="Dashboard"
                  >
                    ⚡
                  </ActionIcon>
                  <ActionIcon
                    size="lg"
                    variant="light"
                    color="red"
                    onClick={logout}
                    aria-label="Logout"
                    title="Logout"
                  >
                    ↪
                  </ActionIcon>
                </>
              ) : (
                <UnstyledButton
                  w={8}
                  h={24}
                  opacity={0}
                  aria-label="Admin login"
                  onClick={() => setShowLogin(true)}
                />
              )}
              <Indicator label={cart.length} disabled={!cart.length} size={18} offset={3}>
                <ActionIcon
                  size="lg"
                  variant="filled"
                  color="dark"
                  onClick={() => setShowCart(true)}
                  aria-label={`Open cart (${cart.length})`}
                >
                  🛒
                </ActionIcon>
              </Indicator>
              <Burger
                hiddenFrom="xl"
                opened={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-controls="mobile-navigation"
                aria-expanded={menuOpen}
                size="sm"
              />
            </Group>
          </Flex>
        </Container>
      </Box>
      <Box h={headerRect.height} aria-hidden="true" />
      <Drawer
        opened={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Explore Longlife Digital"
        position="right"
        size="sm"
        zIndex={300}
      >
        <Stack id="mobile-navigation" gap="sm">
          <TextInput
            aria-label="Search products in menu"
            placeholder="Search products..."
            value={search}
            onChange={updateSearch}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setMenuOpen(false);
            }}
          />
          {search && (
            <Button
              variant="light"
              onClick={() => {
                setPage('shop');
                setMenuOpen(false);
              }}
            >
              View search results
            </Button>
          )}
          {[...LINKS, ['blog', 'Blog']].map(([id, label]) => (
            <NavLink
              component="button"
              key={id}
              active={page === id}
              label={label}
              onClick={() => navigate(id)}
            />
          ))}
          <NavLink
            component="button"
            label={`Cart (${cart.length})`}
            onClick={() => {
              setShowCart(true);
              setMenuOpen(false);
            }}
          />
        </Stack>
      </Drawer>
    </>
  );
}
