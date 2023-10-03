/**
 * @jest-environment ./test/custom.testenv.js
 *
 * Necessary due to JSDOM not providing TextDecoder
 * https://stackoverflow.com/a/57713960
 */
import 'whatwg-fetch';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import Blob from 'cross-blob';

import { createPinataUploader } from './pinata-browser';

beforeEach(() => {
  jest.resetAllMocks();
});

it('should pin images (web)', async () => {
  const { uploadProvider, file } = await mockDependencies();

  const upload = await uploadProvider(file);

  expect(upload.toString()).toEqual('ipfs://QmPhT2FsbyQ2p2gmKBt42Voqr9izxhUn8yLPKg2NqtrGWi');
});

async function mockDependencies() {
  const file = new (global.Blob || Blob)([readFileSync(resolve(__dirname, './test-image.png'))], {
    type: 'image/png',
  });
  // TODO: fix "is not assignable to type IDE error"
  // file.arrayBuffer = async () => {
  //   return Buffer.from('123123');
  // };

  const config = {
    pinataApiKey: process.env.PINATAAPIKEY,
    pinataSecretApiKey: process.env.PINATASECRETAPIKEY,
    pinataJWTKey: process.env.PINATAJWTKEY,
  };
  const pinOpts = { pinataMetadata: { name: 'test-image.jpg' } };
  const uploadProvider = createPinataUploader(config, pinOpts);
  return {
    file,
    config,
    pinOpts,
    uploadProvider,
  };
}
