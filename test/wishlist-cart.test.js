import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

test('wishlist replacement moves into the native slot and survives repeated scans and native remounts', async () => {
  const source = await readFile(new URL('../src/cart-tools.js', import.meta.url), 'utf8');
  const context = vm.createContext({});
  vm.runInContext(source, context);
  const place = context.placeWishlistCartButton;
  function element(parent) {
    const classes = new Set();
    const node = {
      parent, classList: { add: name => classes.add(name), contains: name => classes.has(name) },
      get previousElementSibling() { return this.parent.children[this.parent.children.indexOf(this) - 1]; },
      before(other) {
        if (other.parent) other.parent.children.splice(other.parent.children.indexOf(other), 1);
        other.parent = this.parent;
        this.parent.children.splice(this.parent.children.indexOf(this), 0, other);
      }
    };
    parent.children.push(node);
    return node;
  }
  const row = { children: [], querySelector: () => native };
  const slot = { children: [] };
  const control = element(row);
  let native = null;
  assert.equal(place(row, control), false);
  native = element(slot);
  assert.equal(place(row, control), true);
  assert.deepEqual(slot.children, [control, native]);
  assert.equal(row.children.length, 0);
  assert.equal(native.classList.contains('sse-wishlist-native-cart'), true);
  assert.equal(control.classList.contains('sse-wishlist-cart'), true);
  place(row, control);
  assert.equal(slot.children.length, 2);
  const newSlot = { children: [] };
  native = element(newSlot);
  place(row, control);
  assert.deepEqual(newSlot.children, [control, native]);
  assert.equal(slot.children.length, 1);
});
