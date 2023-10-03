import { addUrlResolver, createPrefixConverter, resolveUrl } from './url-converter';

it('should convert ipfs url to https', () => {
  addUrlResolver('ipfs:', createPrefixConverter('https://2eff.lukso.dev/ipfs'));

  // Utility to conver URLs after addURLResolver has been called.
  const url = resolveUrl(new URL('ipfs://QmPLqMFHxiUgYAom3Zg4SiwoxDaFcZpHXpCmiDzxrtjSGp'));

  expect(url.toString()).toEqual(
    'https://2eff.lukso.dev/ipfs/QmPLqMFHxiUgYAom3Zg4SiwoxDaFcZpHXpCmiDzxrtjSGp'
  );
});
