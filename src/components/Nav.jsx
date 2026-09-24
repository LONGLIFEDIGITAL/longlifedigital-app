import useNavigationContent from '../hooks/useNavigationContent';
import ContentLink from './ContentLink';
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
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { useResizeObserver } from '@mantine/hooks';
import { Link } from 'react-router';
import LDLogo from './LDLogo';
import SkeletonBlock from './skeletons/SkeletonBlock';
import SkeletonRegion from './skeletons/SkeletonRegion';
import { getCartCount } from '../utils/cart';
import classes from './Nav.module.css';
export default function Nav({
  settings,
  settingsStatus,
  setPage,
  annBarHidden,
  scrolled,
  search,
  setSearch,
  setFilterCat,
  isAdmin,
  cmsManaged,
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
  const { brand, contact, announcement } = settings;
  const navigation = useNavigationContent();
  const showAnnouncement = announcement.enabled && Boolean(announcement.message);
  const announcementLink = announcement.cta;
  const [headerRef, headerRect] = useResizeObserver();
  const [announcementRef, announcementRect] = useResizeObserver();
  const cartCount = getCartCount(cart);
  const closeNavigation = () => {
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
          transform:
            annBarHidden && showAnnouncement
              ? `translateY(-${announcementRect.height}px)`
              : 'translateY(0)',
        }}
      >
        <Box ref={announcementRef} className={classes.announcement}>
          {showAnnouncement && (
            <Text size="xs" ta="center" c="white" lh={1.6} px="md" py={8}>
              {announcement.message}
              {announcement.couponCode && (
                <>
                  {' '}
                  — Code: <strong>{announcement.couponCode}</strong>
                </>
              )}
              <Text component="span" visibleFrom="sm" inherit>
                {announcement.deliveryNote && <> | {announcement.deliveryNote}</>}
                {contact.email && <> | 📧 {contact.email}</>}
              </Text>
              {announcementLink.label && announcementLink.destination && (
                <>
                  {' '}
                  |{' '}
                  {announcementLink.destination.startsWith('/') ? (
                    <Link className={classes.announcementLink} to={announcementLink.destination}>
                      {announcementLink.label}
                    </Link>
                  ) : (
                    <a className={classes.announcementLink} href={announcementLink.destination}>
                      {announcementLink.label}
                    </a>
                  )}
                </>
              )}
            </Text>
          )}
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
              onClick={() => {
                setPage('home');
                closeNavigation();
              }}
              aria-label={`${brand.name || 'Storefront'} home`}
            >
              <Group gap={10} wrap="nowrap">
                <LDLogo size={36} src={brand.logo.src} alt={brand.logo.alt} />
                <Box miw={0}>
                  {settingsStatus === 'loading' ? (
                    <SkeletonRegion label="Loading site details">
                      <SkeletonBlock width={120} height={20} />
                    </SkeletonRegion>
                  ) : (
                    <>
                      <Text
                        className={classes.brandName}
                        fz={{
                          base: 14,
                          sm: 16,
                        }}
                      >
                        {brand.name || 'Storefront'}
                      </Text>
                      {brand.tagline && (
                        <Text className={classes.brandSubtitle} visibleFrom="sm">
                          {brand.tagline}
                        </Text>
                      )}
                    </>
                  )}
                </Box>
              </Group>
            </UnstyledButton>
            <Group visibleFrom="xl" gap={4} wrap="nowrap" ml="auto">
              {navigation.header.map((item) =>
                item.children.length ? (
                  <Menu
                    key={item.id}
                    trigger="click-hover"
                    opened={activeDropdown === item.id}
                    onChange={(opened) => setActiveDropdown(opened ? item.id : null)}
                    withinPortal
                    zIndex={150}
                    width={320}
                  >
                    <Menu.Target>
                      <Button variant="subtle" color="dark" size="sm" px={10} rightSection="▾">
                        {item.title}
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        component={ContentLink}
                        item={item}
                        website={brand.website}
                        onClick={closeNavigation}
                      >
                        View {item.title}
                      </Menu.Item>
                      <Menu.Divider />
                      {item.children.map((child) => (
                        <Menu.Item
                          key={child.id}
                          component={ContentLink}
                          item={child}
                          website={brand.website}
                          onClick={closeNavigation}
                        >
                          {child.icon} {child.title}
                          {child.description && (
                            <Text size="xs" c="dimmed">
                              {child.description}
                            </Text>
                          )}
                        </Menu.Item>
                      ))}
                    </Menu.Dropdown>
                  </Menu>
                ) : (
                  <Button
                    key={item.id}
                    component={ContentLink}
                    item={item}
                    website={brand.website}
                    variant="subtle"
                    size="sm"
                    px={10}
                    color="dark"
                    onClick={closeNavigation}
                  >
                    {item.title}
                  </Button>
                ),
              )}
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
                leftSection={<span style={{ fontSize: 28 }}>⌕</span>}
                value={search}
                onChange={updateSearch}
              />
              {!cmsManaged &&
                (isAdmin ? (
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
                ))}
              <Indicator label={cartCount} disabled={!cartCount} size={18} offset={3}>
                <ActionIcon
                  size="lg"
                  variant="filled"
                  color="dark"
                  onClick={() => setShowCart(true)}
                  aria-label={`Open cart (${cartCount})`}
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
        title={`Explore ${brand.name || 'our store'}`}
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
          {navigation.header.map((item) => (
            <Box key={item.id}>
              <NavLink
                component={ContentLink}
                item={item}
                website={brand.website}
                label={item.title}
                onClick={closeNavigation}
              />
              {item.children.map((child) => (
                <NavLink
                  key={child.id}
                  pl="xl"
                  component={ContentLink}
                  item={child}
                  website={brand.website}
                  label={child.title}
                  onClick={closeNavigation}
                />
              ))}
            </Box>
          ))}
          <NavLink
            component="button"
            label={`Cart (${cartCount})`}
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
