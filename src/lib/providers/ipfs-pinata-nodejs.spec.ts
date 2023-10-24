/**
 * @jest-environment node
 *
 * Necessary due to JSDOM not providing TextDecoder
 * https://stackoverflow.com/a/57713960
 */
import { Readable } from 'node:stream';

import { PinataFormDataUploader } from './pinata-formdata-client';

describe('Pinata upload provider (node)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should pin images (web)', async () => {
    const { uploadFormData, uploader, getFile } = await mockDependencies();

    const upload = await uploader.upload(getFile());

    expect(uploadFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({}),
      }),
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
    const config = { pinataApiKey: 'sample-api-key', pinataSecretApiKey: 'some-secret-key' };
    const uploader = new PinataFormDataUploader(config);
    const uploadFormData = jest.spyOn(uploader, 'uploadFormData');
    (uploadFormData as jest.Mock).mockImplementation(async () => {
      return { IpfsHash: 'QmY4Z' };
    });
    return {
      getFile,
      config,
      uploadFormData,
      uploader,
    };
  }
});
