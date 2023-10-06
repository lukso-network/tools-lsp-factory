import { PinataConfig, PinataPinOptions } from '@pinata/sdk';

import {
  uploadToIPFS,
  validateMetadata,
  validatePinataOptions,
} from '../helpers/pinata-helpers-browser';
import { AssetBuffer } from '../interfaces/metadata';
import { UploadProvider } from '../interfaces/profile-upload-options';

/**
 * Create upload provider to upload to Pinata
 *
 * @param pinataConfig configuration for pinata
 * @param pinOptions pin options to use for all uploads
 * @returns <URL> return URL of uploaded file
 */
export function createPinataBrowserUploader(
  pinataConfig: PinataConfig,
  pinOptions?: PinataPinOptions
): UploadProvider<PinataPinOptions> {
  const fn = async (data: any, options?: PinataPinOptions): Promise<URL> => {
    let meta: { 'content-type': string } | undefined;
    const dataContent = new FormData();
    if (!('on' in data) && typeof data !== 'string') {
      if ('size' in data && 'type' in data) {
        const blob = data;
        meta = { 'content-type': blob.type, ...(blob.name ? { name: blob.name } : {}) };
        dataContent.append('file', blob);
      } else if ('buffer' in data && 'mimeType' in data) {
        const assetBuffer = data as AssetBuffer;
        meta = { 'content-type': assetBuffer.mimeType };
        dataContent.append('file', new Blob([assetBuffer.buffer]));
      } else if (Buffer.isBuffer(data)) {
        dataContent.append('file', new Blob([data]));
      } else if ('on' in data && 'pipe' in data) {
        dataContent.append('file', data);
      } else {
        throw new Error('Unknown upload data format');
      }
    } else {
      dataContent.append('file', data);
    }
    const finalOptions = {
      ...pinOptions,
      ...options,
      ...(pinOptions?.pinataMetadata || meta || options?.pinataMetadata
        ? {
            pinataMetadata: {
              ...pinOptions?.pinataMetadata,
              ...options?.pinataMetadata,
              ...meta,
            },
          }
        : {}),
    };
    if (finalOptions.pinataMetadata) {
      validateMetadata(finalOptions.pinataMetadata);
      dataContent.append('pinataMetadata', JSON.stringify(finalOptions.pinataMetadata));
    }
    if (finalOptions.pinataOptions) {
      validatePinataOptions(finalOptions.pinataOptions);
      dataContent.append('pinataOptions', JSON.stringify(finalOptions.pinataOptions));
    }
    return await uploadToIPFS(pinataConfig, dataContent as any);
  };
  return fn;
}
