import DeleteProductModal from './components/DeleteProductModal';
import ProductEditor from './components/ProductEditor';
import ContactEditor from './components/ContactEditor';
import AdminDashboard from './components/AdminDashboard';
import NewsletterPopup from './components/NewsletterPopup';
import { Box } from '@mantine/core';
import { useState, useEffect } from 'react';
import { ScrollRestoration } from 'react-router';
import { useStripePayment } from './payments';
import { EMPTY_FORM, DEFAULT_CONTACT } from './constants/data';
import useCatalog from './hooks/useCatalog';
import useAppNavigation from './hooks/useAppNavigation';
import CatalogStatus from './components/CatalogStatus';
import { matchesCategory } from './services/catalog';
import { addCartItem, adjustCartQuantity, getItemQuantity, getQuantityLimits } from './utils/cart';
import Nav from './components/Nav';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import Toast from './components/Toast';
import LoginModal from './components/LoginModal';
import AIChat from './components/AIChat';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import AboutPage from './pages/AboutPage';
import BlogPage from './pages/BlogPage';
import ServicesPage from './pages/ServicesPage';
import CoursesPage from './pages/CoursesPage';
import DomainsPage from './pages/DomainsPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import RefundPage from './pages/RefundPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';
export default function App() {
  const { page, setPage, productId, goProduct } = useAppNavigation();
  const {
    products,
    setProducts,
    status: catalogStatus,
    retry: retryCatalog,
    managed: cmsManaged,
    categories,
  } = useCatalog();
  const selProduct = products.find((product) => String(product.id) === productId);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [delId, setDelId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginPass, setLoginPass] = useState('');
  const [loginErr, setLoginErr] = useState(false);
  const [toast, setToast] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [annBarHidden, setAnnBarHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subscribers, setSubscribers] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [orderInfo, setOrderInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [payMethod, setPayMethod] = useState('card');
  const [cardNum, setCardNum] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [orderNum, setOrderNum] = useState('');
  const [processing, setProcessing] = useState(false);
  const {
    clientSecret,
    loading: stripeLoading,
    error: stripeError,
    createPaymentIntent,
    reset: resetStripe,
  } = useStripePayment();
  const [subName, setSubName] = useState('');
  const [subEmail, setSubEmail] = useState('');
  const [subConsent, setSubConsent] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupName, setPopupName] = useState('');
  const [popupEmail, setPopupEmail] = useState('');
  const [popupConsent, setPopupConsent] = useState(false);
  const [popupDone, setPopupDone] = useState(false);
  const [contact, setContact] = useState(DEFAULT_CONTACT);
  const [showContactEdit, setShowContactEdit] = useState(false);
  const [contactForm, setContactForm] = useState(DEFAULT_CONTACT);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashTab, setDashTab] = useState('overview');
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: 'Owner',
      email: 'support@lldhome.com',
      role: 'owner',
      status: 'active',
      added: 'Jan 2024',
      lastLogin: 'Today',
      permissions: ['all'],
    },
  ]);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    role: 'va',
    password: '',
  });
  const [editMemberId, setEditMemberId] = useState(null);
  const [orders, setOrders] = useState([
    {
      id: 'LD-001',
      customer: 'Sarah Johnson',
      email: 'sarah@email.com',
      product: 'AI Wealth Accelerator Bundle',
      amount: 497,
      status: 'completed',
      date: 'Jan 20, 2024',
      method: 'card',
    },
    {
      id: 'LD-002',
      customer: 'Marcus Williams',
      email: 'marcus@email.com',
      product: 'AI Prompts for Real Estate Agents',
      amount: 37,
      status: 'completed',
      date: 'Jan 19, 2024',
      method: 'google',
    },
    {
      id: 'LD-003',
      customer: 'Emma Davis',
      email: 'emma@email.com',
      product: 'Migraine & Headache Tracker',
      amount: 12,
      status: 'completed',
      date: 'Jan 18, 2024',
      method: 'card',
    },
    {
      id: 'LD-004',
      customer: 'James Brown',
      email: 'james@email.com',
      product: 'AI Money Machine Toolkit',
      amount: 47,
      status: 'completed',
      date: 'Jan 17, 2024',
      method: 'apple',
    },
    {
      id: 'LD-005',
      customer: 'Lisa Chen',
      email: 'lisa@email.com',
      product: 'PLR Online Business Bundle',
      amount: 67,
      status: 'refunded',
      date: 'Jan 16, 2024',
      method: 'card',
    },
  ]);
  const ROLE_PASSWORDS = {
    owner: 'longlife2024',
    manager: 'manager2024',
    va: 'va2024',
  };
  const ROLE_PERMISSIONS = {
    owner: ['dashboard', 'products', 'orders', 'members', 'store', 'subscribers', 'contact'],
    manager: ['dashboard', 'products', 'orders', 'subscribers'],
    va: ['dashboard', 'products', 'subscribers'],
  };
  const canDo = (perm) => {
    if (!userRole) return false;
    return ROLE_PERMISSIONS[userRole]?.includes(perm) || false;
  };
  useEffect(() => {
    let lastY = 0;
    const fn = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 10);
      setAnnBarHidden(currentY > lastY && currentY > 60);
      lastY = currentY;
    };
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  useEffect(() => {
    const closeNavigationOverlays = () => {
      setMenuOpen(false);
      setActiveDropdown(null);
      setShowCart(false);
      setShowCheckout(false);
    };
    window.addEventListener('popstate', closeNavigationOverlays);
    return () => window.removeEventListener('popstate', closeNavigationOverlays);
  }, []);
  useEffect(() => {
    if (cmsManaged) return;
    let count = 0;
    let timer = null;
    const handler = (e) => {
      if (e.key === 'a' || e.key === 'A') {
        count++;
        clearTimeout(timer);
        timer = setTimeout(() => {
          count = 0;
        }, 800);
        if (count >= 3) {
          count = 0;
          if (!isAdmin) setShowLogin(true);
          else setShowDashboard(true);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAdmin, cmsManaged]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (!subscribed && !popupDone) setShowPopup(true);
    }, 30000);
    return () => clearTimeout(t);
  }, []);
  const fire = (msg, type = 'ok') => {
    setToast({
      msg,
      type,
    });
    setTimeout(() => setToast(null), 3000);
  };
  const addCart = (p) => {
    if (p.canAddToCart === false) {
      fire(p.availability || 'This product is currently unavailable.', 'info');
      return;
    }
    if (cart.some((item) => (item.currency || 'USD') !== (p.currency || 'USD'))) {
      fire('Please use separate carts for different currencies.', 'info');
      return;
    }
    const existing = cart.find((item) => item.id === p.id);
    if (existing && getItemQuantity(existing) >= getQuantityLimits(existing).maximum) {
      fire('The maximum quantity is already in your cart.', 'info');
      return;
    }
    setCart((prev) => addCartItem(prev, p));
    fire(existing ? `Quantity updated for "${p.name}".` : `"${p.name}" added to cart!`);
  };
  const rmCart = (id) => setCart((prev) => prev.filter((i) => i.id !== id));
  const changeCartQuantity = (id, direction) =>
    setCart((prev) => adjustCartQuantity(prev, id, direction));
  const login = () => {
    const role = Object.keys(ROLE_PASSWORDS).find((r) => ROLE_PASSWORDS[r] === loginPass);
    if (role) {
      setIsAdmin(true);
      setUserRole(role);
      setShowLogin(false);
      setLoginPass('');
      setLoginErr(false);
      fire(
        `Welcome back${role === 'owner' ? ' Owner' : role === 'manager' ? ' Manager' : ' VA'}! ✦`,
      );
    } else {
      setLoginErr(true);
      setLoginPass('');
    }
  };
  const logout = () => {
    setIsAdmin(false);
    setUserRole(null);
    setShowDashboard(false);
    fire('Logged out.', 'info');
  };
  const guard = (fn) => {
    if (cmsManaged) return;
    if (!isAdmin) {
      setShowLogin(true);
      return;
    }
    fn();
  };
  const openAdd = () =>
    guard(() => {
      setForm(EMPTY_FORM);
      setEditId(null);
      setShowForm(true);
    });
  const openEdit = (p) =>
    guard(() => {
      setForm({
        name: p.name,
        cat: p.cat,
        price: String(p.price),
        oldPrice: String(p.oldPrice || ''),
        tag: p.tag || '',
        desc: p.desc,
        includes: p.includes || '',
        level: p.level || '',
        duration: p.duration || '',
        featured: p.featured || false,
        payhipUrl: p.payhipUrl || '',
        stripeUrl: p.stripeUrl || '',
        image: p.image || '',
        thumbnail: p.thumbnail || '',
        pdfFile: p.pdfFile || '',
        pdfName: p.pdfName || '',
        pdfSize: p.pdfSize || '',
      });
      setEditId(p.id);
      setShowForm(true);
    });
  const openDel = (id) => guard(() => setDelId(id));
  const saveProduct = () => {
    if (!form.name || !form.price || !form.desc) {
      fire('Fill all required fields.', 'err');
      return;
    }
    const data = {
      ...form,
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      rating: 4.8,
      reviews: 0,
    };
    if (editId) {
      setProducts((p) =>
        p.map((x) =>
          x.id === editId
            ? {
                ...x,
                ...data,
              }
            : x,
        ),
      );
      fire('Product updated!');
    } else {
      setProducts((p) => [
        ...p,
        {
          ...data,
          id: Date.now(),
        },
      ]);
      fire('Product published!');
    }
    setShowForm(false);
    setEditId(null);
  };
  const delProduct = (id) => {
    setProducts((p) => p.filter((x) => x.id !== id));
    setDelId(null);
    fire('Product removed.', 'info');
  };
  const openCheckout = (p) => {
    if (p.source === 'woocommerce') {
      fire('Checkout is not available yet.', 'info');
      return;
    }
    setCheckoutItem(p);
    setCheckoutStep(1);
    setOrderInfo({
      name: '',
      email: '',
      phone: '',
    });
    setCardNum('');
    setCardExp('');
    setCardCvc('');
    setCardName('');
    setPayMethod('card');
    setProcessing(false);
    resetStripe();
    setShowCheckout(true);
  };
  const STRIPE_KEY =
    'pk_live_51TYT5WFUxxwF6THk5f6W6lnpuySIg76odRKfr78vYHPWeXmDPfxMRhVJrhq0Gp1BghRnjM2E8Lm41eoccOj33HIw00SuUZ07j5';
  const filtered = products
    .filter((p) => matchesCategory(p, filterCat))
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sortBy === 'price-asc'
        ? a.price - b.price
        : sortBy === 'price-desc'
          ? b.price - a.price
          : sortBy === 'name'
            ? a.name.localeCompare(b.name)
            : Number(b.featured) - Number(a.featured),
    );
  return (
    <Box c="#111827" bg="#fff" ff="'Inter',sans-serif" mih="100vh">
      <Toast toast={toast} />
      <Nav
        cmsManaged={cmsManaged}
        page={page}
        setPage={setPage}
        annBarHidden={annBarHidden}
        scrolled={scrolled}
        search={search}
        setSearch={setSearch}
        setFilterCat={setFilterCat}
        isAdmin={isAdmin}
        logout={logout}
        setShowLogin={setShowLogin}
        setShowDashboard={setShowDashboard}
        cart={cart}
        setShowCart={setShowCart}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        activeDropdown={activeDropdown}
        setActiveDropdown={setActiveDropdown}
      />
      <Box component="main" id="main-content" bg="#fff" mih="100vh">
        {page === 'home' && (
          <HomePage
            products={products}
            categories={categories}
            catalogStatus={catalogStatus}
            retryCatalog={retryCatalog}
            cmsManaged={cmsManaged}
            setPage={setPage}
            setFilterCat={setFilterCat}
            goProduct={goProduct}
            addCart={addCart}
            fire={fire}
            isAdmin={isAdmin}
            openAdd={openAdd}
            openEdit={openEdit}
            openDel={openDel}
            subName={subName}
            setSubName={setSubName}
            subEmail={subEmail}
            setSubEmail={setSubEmail}
            subConsent={subConsent}
            setSubConsent={setSubConsent}
            subscribed={subscribed}
            setSubscribed={setSubscribed}
            setSubscribers={setSubscribers}
            contact={contact}
          />
        )}
        {page === 'shop' && (
          <ShopPage
            products={products}
            categories={categories}
            catalogStatus={catalogStatus}
            retryCatalog={retryCatalog}
            filtered={filtered}
            filterCat={filterCat}
            setFilterCat={setFilterCat}
            sortBy={sortBy}
            setSortBy={setSortBy}
            isAdmin={isAdmin}
            openAdd={openAdd}
            addCart={addCart}
            goProduct={goProduct}
            fire={fire}
            openEdit={openEdit}
            openDel={openDel}
          />
        )}
        {page === 'product' && catalogStatus !== 'ready' && (
          <CatalogStatus status={catalogStatus} retry={retryCatalog} />
        )}
        {page === 'product' && catalogStatus === 'ready' && !selProduct && (
          <NotFoundPage product setPage={setPage} />
        )}
        {page === 'product' && selProduct && (
          <ProductPage
            selProduct={selProduct}
            products={products}
            setPage={setPage}
            addCart={addCart}
            fire={fire}
            isAdmin={isAdmin}
            openEdit={openEdit}
            openDel={openDel}
            goProduct={goProduct}
          />
        )}
        {page === 'about' && (
          <AboutPage
            contact={contact}
            isAdmin={isAdmin}
            setContactForm={setContactForm}
            setShowContactEdit={setShowContactEdit}
          />
        )}
        {page === 'blog' && <BlogPage />}
        {page === 'services' && <ServicesPage setPage={setPage} />}
        {page === 'courses' && (
          <CoursesPage
            products={products}
            catalogStatus={catalogStatus}
            retryCatalog={retryCatalog}
            addCart={addCart}
            goProduct={goProduct}
            fire={fire}
            isAdmin={isAdmin}
            openEdit={openEdit}
            openDel={openDel}
          />
        )}
        {page === 'domains' && <DomainsPage setPage={setPage} />}
        {page === 'contact' && <ContactPage fire={fire} />}
        {page === 'faq' && <FAQPage setPage={setPage} />}
        {page === 'refund' && <RefundPage />}
        {page === 'privacy' && <PrivacyPage />}
        {page === 'terms' && <TermsPage />}
        {page === 'not-found' && <NotFoundPage setPage={setPage} />}
      </Box>
      {showCart && (
        <CartDrawer
          cart={cart}
          setShowCart={setShowCart}
          rmCart={rmCart}
          changeCartQuantity={changeCartQuantity}
          setPage={setPage}
          openCheckout={openCheckout}
          setCart={setCart}
        />
      )}
      <LoginModal
        showLogin={showLogin}
        setShowLogin={setShowLogin}
        loginPass={loginPass}
        setLoginPass={setLoginPass}
        loginErr={loginErr}
        setLoginErr={setLoginErr}
        login={login}
      />
      {delId && <DeleteProductModal delId={delId} delProduct={delProduct} setDelId={setDelId} />}
      {showForm && (
        <ProductEditor
          editId={editId}
          form={form}
          saveProduct={saveProduct}
          setForm={setForm}
          setShowForm={setShowForm}
        />
      )}
      {showContactEdit && (
        <ContactEditor
          contactForm={contactForm}
          fire={fire}
          setContact={setContact}
          setContactForm={setContactForm}
          setShowContactEdit={setShowContactEdit}
        />
      )}
      {showDashboard && isAdmin && (
        <AdminDashboard
          canDo={canDo}
          dashTab={dashTab}
          editMemberId={editMemberId}
          fire={fire}
          memberForm={memberForm}
          openAdd={openAdd}
          openDel={openDel}
          openEdit={openEdit}
          orders={orders}
          products={products}
          setDashTab={setDashTab}
          setEditMemberId={setEditMemberId}
          setMemberForm={setMemberForm}
          setShowDashboard={setShowDashboard}
          setShowMemberForm={setShowMemberForm}
          setTeamMembers={setTeamMembers}
          showMemberForm={showMemberForm}
          subscribers={subscribers}
          teamMembers={teamMembers}
          userRole={userRole}
        />
      )}
      {showPopup && !popupDone && (
        <NewsletterPopup
          fire={fire}
          popupConsent={popupConsent}
          popupEmail={popupEmail}
          popupName={popupName}
          setPopupConsent={setPopupConsent}
          setPopupDone={setPopupDone}
          setPopupEmail={setPopupEmail}
          setPopupName={setPopupName}
          setShowPopup={setShowPopup}
          setSubscribed={setSubscribed}
          setSubscribers={setSubscribers}
        />
      )}
      <CheckoutModal
        showCheckout={showCheckout}
        checkoutItem={checkoutItem}
        setShowCheckout={setShowCheckout}
        checkoutStep={checkoutStep}
        setCheckoutStep={setCheckoutStep}
        orderInfo={orderInfo}
        setOrderInfo={setOrderInfo}
        stripeLoading={stripeLoading}
        stripeError={stripeError}
        clientSecret={clientSecret}
        createPaymentIntent={createPaymentIntent}
        resetStripe={resetStripe}
        setCart={setCart}
        fire={fire}
        setPage={setPage}
        orderNum={orderNum}
        setOrderNum={setOrderNum}
      />
      <AIChat />
      <ScrollRestoration />
    </Box>
  );
}
