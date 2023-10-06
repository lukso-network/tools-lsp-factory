/**
 * @jest-environment ./test/custom.testenv.js
 *
 * Necessary due to JSDOM not providing TextDecoder
 * https://stackoverflow.com/a/57713960
 */
import 'whatwg-fetch';
import FormData from 'form-data';

import { uploadToIPFS } from '../helpers/pinata-helpers-browser';

import { createPinataBrowserUploader } from './pinata-browser';

jest.mock('../helpers/pinata-helpers-browser', () => {
  const actual = jest.requireActual('../helpers/pinata-helpers-browser');
  return {
    ...actual,
    uploadToIPFS: jest.fn(),
  };
});

beforeEach(() => {
  jest.resetAllMocks();
});

const config = {};

it('should pin images (web)', async () => {
  const { uploadToIPFS, uploadProvider, file } = await mockDependencies();

  const upload = await uploadProvider(file);

  expect(uploadToIPFS).toHaveBeenCalledWith(config, expect.any(global.FormData || FormData));

  expect(upload.toString()).toEqual('ipfs://QmY4Z');
});

async function mockDependencies() {
  const file = new Blob([Buffer.from('123123')], { type: 'image/png' });

  const pinOpts = { pinataMetadata: { name: 'test-image.png' } };
  const uploadProvider = createPinataBrowserUploader(config, pinOpts);
  (uploadToIPFS as jest.Mock).mockImplementation(async () => {
    return new URL('ipfs://QmY4Z');
  });
  return {
    file,
    config,
    pinOpts,
    uploadToIPFS,
    uploadProvider,
  };
}
