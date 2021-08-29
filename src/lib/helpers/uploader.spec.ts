/**
 * @jest-environment ./test/custom.testenv.js
 *
 * Necessary due to JSDOM not providing TextDecoder
 * https://stackoverflow.com/a/57713960
 */
import imageCompression from 'browser-image-compression';
import { create } from 'ipfs-http-client';

import { imageUpload, ipfsUpload } from './uploader';

jest.mock('ipfs-http-client');
jest.mock('browser-image-compression');

const file = new File(['FileContents'], 'file-name');
describe('#ipfsUpload', () => {
  it('should pin images', async () => {
    const addMock = jest.fn();
    // TODO: fix "does not exist on type... IDE error"
    create.mockReturnValue({
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
    ).rejects.toThrowError('File provided is of type "zip".');
  });

  it('should pin files when using IPFS', async () => {
    const { file, addMock, drawFileInCanvasSpy } = mockDependencies();
    await imageUpload(file, { ipfsClientOptions: {} });

    expect(imageCompression).toHaveBeenCalledTimes(5);
    expect(addMock).toHaveBeenCalledWith(file, { pin: true });
    expect(drawFileInCanvasSpy).toBeCalledTimes(5);
  });
});

function mockDependencies() {
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
  // TODO: fix "does not exist on type... IDE error"
  imageCompression.mockResolvedValue(file);
  const addMock = jest.fn(() => {
    return {
      cid: {},
      size: 2,
      path: '',
    };
  });
  // TODO: fix "does not exist on type... IDE error"
  create.mockReturnValue({
    add: addMock,
  });
  return {
    file,
    addMock,
    drawFileInCanvasSpy,
  };
}
