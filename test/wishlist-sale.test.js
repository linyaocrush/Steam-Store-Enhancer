import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

test('wishlist sale expiry supports Steam active discount timestamps', async () => {
  const source = await readFile(new URL('../src/wishlist-sale.js', import.meta.url), 'utf8');
  const context = vm.createContext({});
  vm.runInContext(source, context);

  assert.equal(context.wishlistSaleEndTimestamp({
    best_purchase_option: { active_discounts: [{ discount_end_date: 1800000000 }] }
  }), 1800000000000);
  assert.equal(context.wishlistSaleEndTimestamp({
    purchase_options: [{ active_discounts: [{ discount_expiration: 1800000000000 }] }]
  }), 1800000000000);
  assert.equal(context.wishlistSaleEndTimestamp({ best_purchase_option: { active_discounts: [] } }), null);
  assert.equal(context.wishlistSaleEndTimestamp(null), null);
});

test('wishlist sale countdown formats days and zero-padded time', async () => {
  const source = await readFile(new URL('../src/wishlist-sale.js', import.meta.url), 'utf8');
  const context = vm.createContext({});
  vm.runInContext(source, context);

  assert.equal(context.formatWishlistSaleCountdown(90061000), '1天 01:01:01');
  assert.equal(context.formatWishlistSaleCountdown(61000), '00:01:01');
  assert.equal(context.formatWishlistSaleCountdown(-10), '00:00:00');
});

test('new React wishlist discount prices are detected without relying on hashed CSS classes', async () => {
  const source = await readFile(new URL('../src/wishlist-sale.js', import.meta.url), 'utf8');
  const context = vm.createContext({});
  vm.runInContext(source, context);

  const accessiblePrice = { getAttribute: () => '立省 78%。原价为 $20.99，折后为 $4.63。' };
  const priceLink = { querySelectorAll: selector => selector === '[aria-label]' ? [accessiblePrice] : [] };
  const row = {
    querySelectorAll(selector) {
      if (selector === '.discount_block') return [];
      if (selector === 'a[href*="/app/"]') return [priceLink];
      return [];
    }
  };

  assert.equal(context.findWishlistSalePrice(row), priceLink);
});
