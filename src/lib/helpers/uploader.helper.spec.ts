/**
 * @jest-environment ./test/custom.testenv.js
 *
 * Necessary due to JSDOM not providing TextDecoder
 * https://stackoverflow.com/a/57713960
 */
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import imageSize from 'image-size';
import { create } from 'ipfs-http-client';

import { SupportedImageBufferFormats } from '../interfaces/lsp3-profile';

import { imageUpload, ipfsUpload, resizeBuffer } from './uploader.helper';

jest.mock('ipfs-http-client');
jest.mock('browser-image-compression');

const file = new File(['FileContents'], 'file-name');
describe('uploader.helper.spec.ts', () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  describe('#ipfsUpload', () => {
    it('should pin images', async () => {
      const addMock = jest.fn();
      (create as jest.Mock).mockReturnValue({
        add: addMock,
      });

      const upload = await ipfsUpload(file, {});

      expect(addMock).toHaveBeenCalledWith(file, { pin: true });
      expect(upload).toEqual(undefined);
    });
  });

  describe('#imageUpload', () => {
    it('should throw an error on invalid input', async () => {
      await expect(
        imageUpload(
          new File(['sdfasdf'], 'file-name', {
            type: 'zip',
          }),
          {
            ipfsClientOptions: {},
          }
        )
      ).rejects.toThrowError("File type: 'zip' does not start with 'image/'");
    });

    it('should pin files when using IPFS', async () => {
      const { file, addMock } = await mockDependencies();
      await imageUpload(file, { ipfsClientOptions: {} });

      expect(addMock).toHaveBeenCalledWith(file, { pin: true });
    });

    it('should resize images', async () => {
      const { file, drawFileInCanvasSpy } = await mockDependencies();
      await imageUpload(file, { ipfsClientOptions: {} });

      expect(imageCompression).toHaveBeenCalledTimes(5);
      expect(drawFileInCanvasSpy).toBeCalledTimes(5);
    });

    it('should accept images as buffer', async () => {
      const { addMock } = await mockDependencies();

      const imageResponse = await axios.get('https://picsum.photos/200/300', {
        responseType: 'arraybuffer',
      });
      const buffer = Buffer.from(imageResponse.data as string, 'binary');

      const result = await imageUpload(
        { buffer, mimeType: SupportedImageBufferFormats.MIME_JPEG },
        { ipfsClientOptions: {} }
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

  describe('#resizeBuffer', () => {
    it('should resize buffer images', async () => {
      const imageResponse = await axios.get('https://picsum.photos/200/300', {
        responseType: 'arraybuffer',
      });
      const buffer = Buffer.from(imageResponse.data as string, 'binary');

      const size = 10;
      const result = await resizeBuffer(buffer as Buffer, 'image/jpeg', size);

      expect(result.byteLength < buffer.byteLength);

      const resizedDimensions = imageSize(result);

      expect(resizedDimensions.height <= size);
      expect(resizedDimensions.width <= size);
    });
  });
});

async function mockDependencies() {
  const file = new File(['123123'], 'test-image.jpg', {
    type: 'image/jpg',
  });
  // TODO: fix "is not assignable to type IDE error"
  file.arrayBuffer = function () {
    return '';
  };

  const drawFileInCanvasSpy = jest.spyOn(imageCompression, 'drawFileInCanvas');
  drawFileInCanvasSpy.mockResolvedValue([
    { width: 10, height: 10 } as ImageBitmap,
    {} as HTMLCanvasElement,
  ]);
  (imageCompression as any as jest.Mock).mockResolvedValue(file);
  const addMock = jest.fn(() => {
    return {
      cid: {},
      size: 2,
      path: '',
    };
  });
  (create as jest.Mock).mockReturnValue({
    add: addMock,
  });

  return {
    file,
    addMock,
    drawFileInCanvasSpy,
  };
}
