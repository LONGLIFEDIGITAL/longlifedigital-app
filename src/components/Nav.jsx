import { useEffect } from 'react';
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
import { Link, useLocation } from 'react-router';
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
  const location = useLocation();
  const isCurrent = (item) => {
    if (!item.destination) return false;
    try {
      const url = new URL(item.destination, window.location.origin);
      if (
        url.origin !== window.location.origin &&
        (!brand.website || url.origin !== new URL(brand.website).origin)
      )
        return false;
      const path = url.pathname.replace(/\/$/, '') || '/';
      const currentPath = location.pathname.replace(/\/$/, '') || '/';
      return (
        (currentPath === path || (path !== '/' && currentPath.startsWith(`${path}/`))) &&
        (!url.search || url.search === location.search) &&
        (!url.hash || url.hash === location.hash)
      );
    } catch {
      return false;
    }
  };
  const isActive = (item) => isCurrent(item) || item.children?.some(isCurrent);
  const navigation = useNavigationContent();
  const showAnnouncement = announcement.enabled && Boolean(announcement.message);
  const announcementLink = announcement.cta;
  const [headerRef, headerRect] = useResizeObserver();
  const [announcementRef, announcementRect] = useResizeObserver();
  const cartCount = getCartCount(cart);
  useEffect(() => {
    const closeDropdown = () => setActiveDropdown(null);
    window.addEventListener('resize', closeDropdown);
    return () => window.removeEventListener('resize', closeDropdown);
  }, [setActiveDropdown]);
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
        <Container size={1680} py={10}>
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
            <div className={classes.inlineNav} aria-label="Quick navigation">
              {navigation.header.map((item) => (
                <div key={item.id} className={classes.navItem}>
                  {item.children.length ? (
                    <Menu
                      trigger="click-hover"
                      openDelay={80}
                      closeDelay={150}
                      opened={activeDropdown === item.id}
                      onChange={(opened) => setActiveDropdown(opened ? item.id : null)}
                      withinPortal
                      zIndex={150}
                      width="min(620px, calc(100vw - 32px))"
                      position="bottom-start"
                    >
                      <Menu.Target>
                        <Button
                          className={classes.navButton}
                          data-active={isActive(item) || undefined}
                          aria-current={isCurrent(item) ? 'page' : undefined}
                          variant="subtle"
                          color="dark"
                          size="sm"
                          rightSection={<span aria-hidden="true">▾</span>}
                          title={item.title}
                        >
                          {item.title}
                        </Button>
                      </Menu.Target>
                      <Menu.Dropdown className={classes.dropdown}>
                        <Menu.Label className={classes.menuHeading}>{item.title}</Menu.Label>
                        <Menu.Divider />
                        <div className={classes.menuGrid}>
                          {item.children.map((child) => (
                            <Menu.Item
                              key={child.id}
                              component={ContentLink}
                              item={child}
                              website={brand.website}
                              onClick={closeNavigation}
                              className={classes.menuItem}
                              data-active={isCurrent(child) || undefined}
                              aria-current={isCurrent(child) ? 'page' : undefined}
                            >
                              <div className={classes.menuEntry}>
                                <span className={classes.menuIcon} aria-hidden="true">
                                  {child.icon || '✦'}
                                </span>
                                <div>
                                  <Text fw={600} size="sm">
                                    {child.title}
                                  </Text>
                                  {child.description && (
                                    <Text size="xs" c="dimmed" mt={4}>
                                      {child.description}
                                    </Text>
                                  )}
                                </div>
                              </div>
                            </Menu.Item>
                          ))}
                        </div>
                        <Menu.Divider />
                        <Menu.Item
                          component={ContentLink}
                          item={item}
                          website={brand.website}
                          onClick={closeNavigation}
                          className={classes.viewAll}
                        >
                          View {item.title} →
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  ) : (
                    <Button
                      component={ContentLink}
                      item={item}
                      website={brand.website}
                      variant="subtle"
                      size="sm"
                      color="dark"
                      className={classes.navButton}
                      data-active={isActive(item) || undefined}
                      aria-current={isCurrent(item) ? 'page' : undefined}
                      title={item.title}
                      onClick={closeNavigation}
                    >
                      {item.title}
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Group
              gap={{
                base: 6,
                sm: 10,
              }}
              wrap="nowrap"
              ml="auto"
            >
              <TextInput
                className={classes.desktopSearch}
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
              <Indicator label={cartCount} disabled={!cartCount} size={16} offset={12}>
                <ActionIcon
                  size={44}
                  variant="transparent"
                  className={classes.cartButton}
                  onClick={() => setShowCart(true)}
                  aria-label={`Open cart (${cartCount})`}
                >
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 32 32"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M2 4h4l4 17h15l4-13H7" />
                    <path d="m10 21-1 4h17" />
                    <path d="M8 12h19M9 16h17M12 8l2 13M18 8v13M24 8l-2 13" strokeWidth="1" />
                    <circle cx="12" cy="28" r="1.7" />
                    <circle cx="24" cy="28" r="1.7" />
                  </svg>
                </ActionIcon>
              </Indicator>
              <Burger
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
                className={classes.drawerLink}
                data-active={isActive(item) || undefined}
                aria-current={isCurrent(item) ? 'page' : undefined}
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
                  className={classes.drawerLink}
                  data-active={isCurrent(child) || undefined}
                  aria-current={isCurrent(child) ? 'page' : undefined}
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
