import { getERC725 } from './erc725.helper';

const randomAddress = '0xc0ffee254729296a45a3885639AC7E10F9d54979';
describe('erc725.js', () => {
  it('should be configured with the address if available', () => {
    const erc725Helper = getERC725(randomAddress);
    expect(erc725Helper.options.address).toEqual(randomAddress);
  });
});
