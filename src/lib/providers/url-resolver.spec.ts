import { UrlConverter, UrlResolver } from './url-resolver';

it('should convert ipfs url to https', () => {
  const resolver = new UrlResolver([new UrlConverter('ipfs://', 'https://2eff.lukso.dev/ipfs/')]);

  // Utility to conver URLs after addURLResolver has been called.
  const url = resolver.resolveUrl('ipfs://QmPLqMFHxiUgYAom3Zg4SiwoxDaFcZpHXpCmiDzxrtjSGp');

  expect(url).toEqual('https://2eff.lukso.dev/ipfs/QmPLqMFHxiUgYAom3Zg4SiwoxDaFcZpHXpCmiDzxrtjSGp');
});
