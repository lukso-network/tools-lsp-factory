/**
 * @param data - File, Readable, ReadStream, AssetBuffer (file to upload)
 * @returns - URL of uploaded file
 */
export type UploadProvider<Options = any> = (data: any, options?: Options) => Promise<URL>;

/**
 * Default upload provider
 */
export let defaultUploadProvider: UploadProvider | undefined;

/**
 * Register a default upload provider with this library
 *
 * @param <UploadProvider> provider
 */
export function setDefaultUploadProvider(provider: UploadProvider): void {
  defaultUploadProvider = provider;
}

/**
 * assert if upload provider is missing and there is no default.
 * If there is a default return it if value was not provided
 *
 * @param <UploadProvider> provider
 */
export function assertUploadProvider(provider?: UploadProvider): UploadProvider {
  provider = provider || defaultUploadProvider;
  if (!provider || typeof provider !== 'function') {
    throw new Error(`Upload provider is required`);
  }
  return provider;
}
