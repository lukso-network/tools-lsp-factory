const resolvers: Map<string, (url: URL) => URL> = new Map();

/**
 * Resolves a URL to a gateway URL
 * @param <URL> url to resolve
 * @returns <URL> resolved url (if resolver is found, otherwise the parameter url is returned)
 */
export function resolveUrl(url: URL) {
  const resolver = resolvers.get(url.protocol);
  if (resolver) {
    return resolver(url);
  }
  return url;
}

/**
 *
 * @param <URL> gateway where to direct the URL to
 * @param <string> search string to append to the gateway URL
 * @returns
 */
export function createPrefixConverter(_gateway: string | URL, search?: string) {
  const gateway = typeof _gateway === 'string' ? new URL(_gateway) : _gateway;
  if (!gateway.host || !gateway.protocol) {
    throw new Error('Invalid gateway URL');
  }
  if (!gateway.pathname.endsWith('/')) {
    gateway.pathname = gateway.pathname + '/';
  }
  return (url: URL) => {
    const base = `${gateway.pathname}${url.hostname}${search || ''}`;
    return new URL(base, gateway);
  };
}

/**
 *
 * @param <string> protocol to resolve (ipfs, arweave, etc.)
 * @param <(url: URL) => URL> resolver how to resolve it (use createPrefixConverter if you have a standard ipfs gateway)
 */
export function addUrlResolver(protocol: string, resolver: (url: URL) => URL) {
  resolvers.set(protocol, resolver);
}
