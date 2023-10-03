/**
 * @jest-environment ./test/custom.testenv.js
 *
 * Necessary due to JSDOM not providing TextDecoder
 * https://stackoverflow.com/a/57713960
 */
import { create } from 'ipfs-http-client';

import { createIPFSUploader } from './ipfs-http-client';

jest.mock('ipfs-http-client');

it('should pin images', async () => {
  const { addMock, uploadProvider, file } = await mockDependencies();

  const upload = await uploadProvider(file);

  expect(addMock).toHaveBeenCalledWith(file, { pin: true });
  expect(upload.toString()).toEqual('ipfs://QmY4Z');
});

async function mockDependencies(gateway = 'https://api.2eff.lukso.dev') {
  const file = new File(['123123'], 'test-image.jpg', {
    type: 'image/jpg',
  });
  // TODO: fix "is not assignable to type IDE error"
  file.arrayBuffer = async function () {
    return Buffer.from('');
  };

  const addMock = jest.fn(async () => {
    return {
      cid: 'QmY4Z',
      size: 2,
      path: '',
    };
  });

  (create as jest.Mock).mockReturnValue({
    add: addMock,
    getEndpointConfig: () => new URL(gateway),
  });

  const uploadProvider = createIPFSUploader(gateway);

  return {
    file,
    addMock,
    uploadProvider,
  };
}
