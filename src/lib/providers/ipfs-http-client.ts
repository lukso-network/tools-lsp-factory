import { create, IPFSHTTPClient, Options } from 'ipfs-http-client';

import { UploadProvider } from '../interfaces/profile-upload-options';

/**
 * Create an upload provider that uses the IPFS HTTP client
 *
 * @param gateway IPFS client configuration
 * @returns <UploadProvider> provider
 */
export function createIPFSUploader(gateway?: string | Options | URL): UploadProvider {
  let ipfs: IPFSHTTPClient;

  if (typeof gateway === 'string') {
    const isPortProvided = gateway.split(':').length > 2;

    let url: string;

    if (gateway.endsWith('/')) {
      url = isPortProvided ? gateway : `${gateway.slice(0, gateway.length - 1)}:${5001}`;
    } else {
      url = isPortProvided ? gateway : `${gateway}:${5001}`;
    }

    ipfs = create({ url });
  } else if (gateway instanceof URL) {
    const { hostname, port, protocol } = gateway;
    ipfs = create({ host: hostname, port: Number.parseInt(port, 10), protocol: protocol });
  } else {
    ipfs = create(gateway);
  }
  return async (data: ReadableStream | Buffer) => {
    const { cid } =
      (await ipfs.add(data, {
        pin: true,
      })) || {};
    if (!cid) {
      throw new Error('IPFS upload failed');
    }
    return new URL(`ipfs://${cid.toString()}`);
  };
}
