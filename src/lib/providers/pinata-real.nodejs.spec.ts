/**
 * @jest-environment node
 *
 * Necessary due to JSDOM not providing TextDecoder
 * https://stackoverflow.com/a/57713960
 */
import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';

import { createPinataUploader } from './pinata';

describe('Pinata upload provider (node)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should pin images (web)', async () => {
    const config = {
      pinataApiKey: process.env.PINATAAPIKEY,
      pinataSecretApiKey: process.env.PINATASECRETAPIKEY,
      pinataJWTKey: process.env.PINATAJWTKEY,
    };
    const uploadProvider = createPinataUploader(config);
    const file = createReadStream(resolve(__dirname, './test-image.png'));
    const upload = await uploadProvider(file, { pinataMetadata: { name: 'test-image.png' } });

    expect(upload.toString()).toEqual('ipfs://QmPhT2FsbyQ2p2gmKBt42Voqr9izxhUn8yLPKg2NqtrGWi');
  });
});
