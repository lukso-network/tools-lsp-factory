/**
 * @jest-environment node
 *
 * Necessary due to JSDOM not providing TextDecoder
 * https://stackoverflow.com/a/57713960
 */
import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';

import { PinataFormDataUploader } from './pinata-formdata-client';

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
    const uploader = new PinataFormDataUploader(config);
    const file = createReadStream(resolve(__dirname, './test-image.png'));
    const upload = await uploader.upload(file, { pinataMetadata: { name: 'test-image.png' } });

    expect(upload.toString()).toEqual('ipfs://QmPhT2FsbyQ2p2gmKBt42Voqr9izxhUn8yLPKg2NqtrGWi');
  });
});
