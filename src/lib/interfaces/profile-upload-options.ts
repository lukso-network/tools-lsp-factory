import { BaseFormDataUploader } from '../providers/formdata-base-client';

/**
 * Default upload provider
 */
export let defaultUploader: BaseFormDataUploader | undefined;

/**
 * Register a default upload provider with this library
 *
 * @param <UploadProvider> provider
 */
export function setDefaultUploadProvider(provider: BaseFormDataUploader): void {
  defaultUploader = provider;
}

/**
 * assert if upload provider is missing and there is no default.
 * If there is a default return it if value was not provided
 *
 * @param <UploadProvider> provider
 */
export function assertUploadProvider(provider?: BaseFormDataUploader): BaseFormDataUploader {
  return provider || defaultUploader;
}
