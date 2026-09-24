import { ActionIcon, Button, Drawer } from '@mantine/core';
import { moneyMinor } from '../services/checkout';
import LoadingImage from './LoadingImage';
import { fmtPrice, catLabel } from '../utils/helpers';
import {
  getCartCount,
  getCartTotal,
  getItemQuantity,
  getLineTotal,
  getQuantityLimits,
} from '../utils/cart';
import { CATS } from '../constants/data';
import classes from './CartDrawer.module.css';

const iconPaths = {
  bag: 'M6 7h12l1 13H5L6 7Zm3 0V5a3 3 0 0 1 6 0v2',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  close: 'm6 6 12 12M6 18 18 6',
  trash: 'M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6',
};

function CartIcon({ name }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

export default function CartDrawer({
  cart,
  setShowCart,
  rmCart,
  changeCartQuantity,
  setPage,
  openCheckout,
  checkoutLoading,
  checkoutEnabled,
  clearCart,
  serverTotals,
  cartError,
}) {
  const cartCount = getCartCount(cart);
  const cartTotal = getCartTotal(cart);
  const unavailable = cart.some((item) => item.canAddToCart === false);
  const money = (item, amount) => fmtPrice(amount, item.currency, item.minorUnit);
  const browseProducts = () => {
    setShowCart(false);
    setPage('shop');
  };

  return (
    <Drawer.Root
      opened
      onClose={() => setShowCart(false)}
      position="right"
      size={440}
      padding={0}
      zIndex={300}
    >
      <Drawer.Overlay backgroundOpacity={0.4} blur={3} />
      <Drawer.Content aria-label="Shopping cart" className={classes.content}>
        <Drawer.Body className={classes.body}>
          <div className={classes.shell}>
            <header className={classes.header}>
              <span className={classes.bagIcon}>
                <CartIcon name="bag" />
              </span>
              <div className={classes.heading}>
                <h2>
                  Your Cart <span className={classes.count}>{cartCount}</span>
                </h2>
                <p>Review your items</p>
              </div>
              <ActionIcon
                onClick={() => setShowCart(false)}
                aria-label="Close cart"
                variant="subtle"
                color="gray"
                size={44}
                radius="md"
              >
                <CartIcon name="close" />
              </ActionIcon>
            </header>

            {cartError && <p role="alert">{cartError}</p>}
            {cart.length === 0 ? (
              <div className={classes.empty}>
                <span className={classes.emptyIcon}>
                  <CartIcon name="bag" />
                </span>
                <h3>Your cart is empty</h3>
                <p>Find something to help your next big idea.</p>
                <Button onClick={browseProducts} color="brand">
                  Browse Products
                </Button>
              </div>
            ) : (
              <>
                <div className={classes.items}>
                  <ul className={classes.list} aria-label="Cart items">
                    {cart.map((item) => {
                      const quantity = getItemQuantity(item);
                      const { minimum, maximum } = getQuantityLimits(item);
                      return (
                        <li key={item.id} className={classes.item} aria-label={item.name}>
                          <div className={classes.itemInfo}>
                            {item.thumbnail || item.image ? (
                              <LoadingImage
                                src={item.thumbnail || item.image}
                                alt=""
                                className={classes.thumbnail}
                              />
                            ) : (
                              <span className={classes.placeholder} aria-hidden="true">
                                {CATS.find((category) => category.id === item.cat)?.icon || (
                                  <CartIcon name="bag" />
                                )}
                              </span>
                            )}
                            <div>
                              <h3 className={classes.itemName}>{item.name}</h3>
                              <p className={classes.category}>
                                {item.categoryLabel || catLabel(item.cat)}
                              </p>
                              <p className={classes.unitPrice}>
                                {item.canAddToCart === false
                                  ? item.availability
                                  : `${money(item, item.price)} each`}
                              </p>
                            </div>
                          </div>
                          <div className={classes.itemControls}>
                            <div
                              className={classes.stepper}
                              role="group"
                              aria-label={`Quantity controls for ${item.name}`}
                            >
                              <ActionIcon
                                variant="subtle"
                                color="brand"
                                size={44}
                                radius="md"
                                aria-label={`Decrease quantity of ${item.name}`}
                                disabled={checkoutLoading || quantity <= minimum}
                                onClick={() => changeCartQuantity(item.id, -1)}
                              >
                                <CartIcon name="minus" />
                              </ActionIcon>
                              <output
                                className={classes.quantity}
                                aria-label={`Quantity for ${item.name}`}
                                aria-live="polite"
                              >
                                {quantity}
                              </output>
                              <ActionIcon
                                variant="subtle"
                                color="brand"
                                size={44}
                                radius="md"
                                aria-label={`Increase quantity of ${item.name}`}
                                disabled={checkoutLoading || quantity >= maximum}
                                onClick={() => changeCartQuantity(item.id, 1)}
                              >
                                <CartIcon name="plus" />
                              </ActionIcon>
                            </div>
                            <div className={classes.lineActions}>
                              <output
                                className={classes.lineTotal}
                                aria-label={`Total for ${item.name}`}
                              >
                                {money(item, item.serverLineTotal ?? getLineTotal(item))}
                              </output>
                              <ActionIcon
                                disabled={checkoutLoading}
                                onClick={() => rmCart(item.id)}
                                variant="light"
                                color="red"
                                size={44}
                                radius="md"
                                aria-label={`Remove ${item.name} from cart`}
                                title="Remove item"
                              >
                                <CartIcon name="trash" />
                              </ActionIcon>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <footer className={classes.footer}>
                  <div className={classes.totalRow}>
                    <span>Subtotal</span>
                    <output aria-label="Cart subtotal" aria-live="polite">
                      {serverTotals
                        ? moneyMinor(serverTotals.total_items, serverTotals)
                        : money(cart[0], cartTotal)}
                    </output>
                  </div>
                  <p className={classes.checkoutNote}>
                    {unavailable
                      ? 'Remove unavailable items before checkout.'
                      : checkoutEnabled
                        ? 'Final prices, discounts and taxes are confirmed at checkout.'
                        : 'Checkout is unavailable while the store is loading or using demo products.'}
                  </p>
                  <div className={classes.checkoutActions}>
                    <Button
                      className={classes.checkoutButton}
                      color="brand"
                      fullWidth
                      loading={checkoutLoading}
                      disabled={!checkoutEnabled || unavailable}
                      onClick={() => openCheckout()}
                    >
                      Proceed to Checkout
                    </Button>
                  </div>
                  <Button
                    disabled={checkoutLoading}
                    onClick={clearCart}
                    variant="subtle"
                    color="gray"
                    fullWidth
                    mt="xs"
                  >
                    Clear Cart
                  </Button>
                </footer>
              </>
            )}
          </div>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  );
}
