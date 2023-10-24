/**
 * @jest-environment ./test/custom.testenv.js
 *
 * Necessary due to JSDOM not providing TextDecoder
 * https://stackoverflow.com/a/57713960
 */
import imageCompression from 'browser-image-compression';
import { create } from 'ipfs-http-client';

import { HttpIPFSClientUploader } from '../providers/ipfs-http-client';

import { imageUpload } from './uploader.helper';

jest.mock('ipfs-http-client');
jest.mock('browser-image-compression');
jest.setTimeout(30000);

describe('uploader.helper.spec.ts', () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  describe('#imageUpload', () => {
    it('should throw an error on invalid input', async () => {
      const { uploader } = await mockDependencies();

      await expect(
        imageUpload(
          new File(['sdfasdf'], 'file-name', {
            type: 'zip',
          }),
          uploader
        )
      ).rejects.toThrowError("File type: 'zip' does not start with 'image/'");
    });

    it('should pin files when using IPFS', async () => {
      const { file, addMock, uploader } = await mockDependencies();
      await imageUpload(file, uploader);

      expect(addMock).toHaveBeenCalledWith(file, { pin: true });
    });

    it('should resize images', async () => {
      const { file, drawFileInCanvasSpy, uploader } = await mockDependencies();
      await imageUpload(file, uploader);

      expect(imageCompression).toHaveBeenCalledTimes(5);
      expect(drawFileInCanvasSpy).toBeCalledTimes(5);
    });
  });
  it('should accept custom IPFS client options', async () => {
    const { addMock, uploader } = await mockDependencies();

    const result = await imageUpload(
      new File(['sdfasdf'], 'file-name', {
        type: 'image/zip',
      }),
      uploader
    );

    expect(addMock).toHaveBeenCalled();

    expect(result.length === 5);
    expect(result[0]).toHaveProperty('width');
    expect(result[0]).toHaveProperty('height');
    expect(result[0]).toHaveProperty('hashFunction');
    expect(result[0]).toHaveProperty('hash');
    expect(result[0]).toHaveProperty('url');
  });

  it('should accept IPFS url', async () => {
    const { addMock, uploader } = await mockDependencies();

    const result = await imageUpload(
      new File(['sdfasdf'], 'file-name', {
        type: 'image/zip',
      }),
      uploader
    );

    expect(addMock).toHaveBeenCalled();

    expect(result.length === 5);
    expect(result[0]).toHaveProperty('width');
    expect(result[0]).toHaveProperty('height');
    expect(result[0]).toHaveProperty('hashFunction');
    expect(result[0]).toHaveProperty('hash');
    expect(result[0]).toHaveProperty('url');
  });
});

async function mockDependencies(gateway = 'https://api.2eff.lukso.dev') {
  const file = new File(['123123'], 'test-image.jpg', {
    type: 'image/jpg',
  });
  // TODO: fix "is not assignable to type IDE error"
  file.arrayBuffer = async function () {
    return Buffer.from('');
  };

  const drawFileInCanvasSpy = jest.spyOn(imageCompression, 'drawFileInCanvas');
  drawFileInCanvasSpy.mockResolvedValue([
    { width: 10, height: 10 } as ImageBitmap,
    {} as HTMLCanvasElement,
  ]);
  (imageCompression as any as jest.Mock).mockResolvedValue(file);
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

  const uploader = new HttpIPFSClientUploader(gateway);

  return {
    file,
    addMock,
    uploader,
    drawFileInCanvasSpy,
  };
}
