import { definedFields, optionalCategory, requirePrice, requireQuantity } from './shared.helpers';

describe('clothing schema helpers', () => {
  it('accepts a clothing category slug', () => {
    expect(optionalCategory('ao')).toBe('ao');
    expect(optionalCategory('  giay  ')).toBe('giay');
  });

  it('treats a blank category as unset', () => {
    expect(optionalCategory(undefined)).toBeUndefined();
    expect(optionalCategory('   ')).toBeUndefined();
  });

  it('rejects an unknown category', () => {
    expect(() => optionalCategory('shirt')).toThrow(/Category must be one of/);
  });

  it('rejects an invalid price or quantity', () => {
    expect(requirePrice(0)).toBe(0);
    expect(() => requirePrice(-1)).toThrow(/non-negative/);
    expect(requireQuantity(2)).toBe(2);
    expect(() => requireQuantity(0)).toThrow(/positive integer/);
    expect(() => requireQuantity(1.5)).toThrow(/positive integer/);
  });

  it('omits unset optional fields before writing to Convex', () => {
    expect(definedFields({ name: 'Áo thun', size: undefined })).toEqual({
      name: 'Áo thun',
    });
  });
});
