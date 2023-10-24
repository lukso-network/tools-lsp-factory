export class UrlConverter {
  /**
   * It will replace whatever is matched with the destination
   * string. So if destination is https://something.com/ipfs/ and
   * match is ipfs:// then the CID will be copied after https://something.com/ipfs/
   * NOTE: The trailing slash is important. The URL class is capable of figuring
   * this out, but it will add a lot additional complexity inside of this library
   *
   * @param pattern matching string or regexp
   * @param destination destination string
   */
  constructor(public readonly pattern: string | RegExp, public readonly destination: string) {}
  match(url: string): boolean {
    return this.pattern instanceof RegExp ? this.pattern.test(url) : url.startsWith(this.pattern);
  }
  resolve(url: string): string {
    return url.replace(this.pattern, this.destination);
  }
}

export class UrlResolver {
  constructor(public readonly converters: Array<UrlConverter>) {}

  /**
   * Resolves a URL to a gateway URL
   *
   * @param <URL> url to resolve
   * @returns <URL> resolved url (if resolver is found, otherwise the parameter url is returned)
   */
  resolveUrl(url: string): string {
    const current = new Set<UrlConverter>(this.converters);
    let found = true;
    while (found) {
      found = false;
      for (const converter of current) {
        if (converter.match(url)) {
          url = converter.resolve(url);
          // This converter matches, so don't use it again.
          current.delete(converter);
          found = true;
          break;
        }
      }
    }
    return url;
  }
}
