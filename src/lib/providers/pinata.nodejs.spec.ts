/**
 * @jest-environment node
 *
 * Necessary due to JSDOM not providing TextDecoder
 * https://stackoverflow.com/a/57713960
 */
import { Readable } from 'node:stream';

import { uploadToIPFS } from '../helpers/pinata-provider-helpers';

jest.mock('../helpers/pinata-provider-helpers', () => {
  const actual = jest.requireActual('../helpers/pinata-provider-helpers');
  return {
    ...actual,
    uploadToIPFS: jest.fn(),
  };
});

import { createPinataUploader } from './pinata-provider';

describe('Pinata upload provider (node)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should pin images (web)', async () => {
    const { uploadToIPFS, uploadProvider, config, getFile } = await mockDependencies();

    const upload = await uploadProvider(getFile());

    expect(uploadToIPFS).toHaveBeenCalledWith(
      config,
      expect.objectContaining({
        _streams: expect.anything(),
        _boundary: expect.anything(),
        _released: false,
      })
    );
    expect(upload.toString()).toEqual('ipfs://QmY4Z');
  });

  async function mockDependencies() {
    const getFile = () => {
      return Readable.from(Buffer.from('123123'));
    };
    const config = { pinataApiKey: 'sample-api-key' };
    const pinOpts = { pinataMetadata: { name: 'test-image.jpg' } };
    const uploadProvider = createPinataUploader(config, pinOpts);
    (uploadToIPFS as jest.Mock).mockImplementation(async () => {
      return new URL('ipfs://QmY4Z');
    });
    return {
      getFile,
      config,
      pinOpts,
      uploadToIPFS,
      uploadProvider,
    };
  }
});
