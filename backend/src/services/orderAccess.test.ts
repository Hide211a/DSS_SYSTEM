import { describe, it, expect } from 'vitest';
import { assertOrderAccess, OrderAccessError } from './orderAccess.js';

describe('orderAccess', () => {
  it('allows owner by userId', () => {
    expect(() =>
      assertOrderAccess({ userId: 'u1', customerEmail: 'a@b.com' }, 'u1')
    ).not.toThrow();
  });

  it('rejects wrong customer', () => {
    expect(() =>
      assertOrderAccess({ userId: 'u1', customerEmail: 'a@b.com' }, 'u2')
    ).toThrow(OrderAccessError);
  });

  it('allows guest order by matching email', () => {
    expect(() =>
      assertOrderAccess({ userId: null, customerEmail: 'guest@test.com' }, null, 'guest@test.com')
    ).not.toThrow();
  });

  it('rejects guest order with wrong email', () => {
    expect(() =>
      assertOrderAccess({ userId: null, customerEmail: 'guest@test.com' }, null, 'other@test.com')
    ).toThrow(OrderAccessError);
  });
});
