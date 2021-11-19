import imageCompression from 'browser-image-compression';
import { keccak256 } from 'ethers/lib/utils';
import { AddResult } from 'ipfs-core-types/src/root';
import { ImportCandidate } from 'ipfs-core-types/src/utils';
import { create, Options } from 'ipfs-http-client';
import Jimp from 'jimp';

import { LSP3ProfileImage } from '../interfaces';
import { ImageBuffer, SupportedImageBufferFormats } from '../interfaces/lsp3-profile';
import { ProfileUploadOptions } from '../interfaces/profile-upload-options';

export const sizes = [1800, 1024, 640, 320, 180];
export async function imageUpload(
  givenFile: File | ImageBuffer,
  uploadOptions: ProfileUploadOptions
): Promise<LSP3ProfileImage[]> {
  const type = 'type' in givenFile ? givenFile.type : givenFile.mimeType;
  const isImage = type?.substr(0, 6) === 'image/';
  if (!isImage) {
    throw new Error(`File provided is of type "${type}".`);
  }

  return Promise.all(
    sizes.map(async (size) => {
      let imgToUpload, imgBuffer, width: number, height: number;

      if ('buffer' in givenFile) {
        imgBuffer = await resizeBuffer(givenFile.buffer, givenFile.mimeType, size);
        height = size;
        width = size;

        imgToUpload = imgBuffer;
      } else {
        imgToUpload = await imageCompression(givenFile, {
          maxWidthOrHeight: size,
          useWebWorker: true,
        });

        imgBuffer = new Uint8Array(await imgToUpload.arrayBuffer());
        const loadedImg = await imageCompression.drawFileInCanvas(imgToUpload);

        height = loadedImg[0].height;
        width = loadedImg[0].width;
      }

      const uploadResponse = await ipfsUpload(imgToUpload, uploadOptions.ipfsClientOptions);

      return {
        width: height,
        height: width,
        hashFunction: 'keccak256(bytes)',
        hash: keccak256(imgBuffer),
        url: 'ipfs://' + uploadResponse.cid.toString(),
      };
    })
  );
}

export async function ipfsUpload(file: ImportCandidate, options: Options): Promise<AddResult> {
  const ipfs = create(options);
  return await ipfs.add(file, {
    pin: true,
  });
}

export async function prepareImageForLSP3(
  uploadOptions?: ProfileUploadOptions,
  image?: File | ImageBuffer | LSP3ProfileImage[]
): Promise<LSP3ProfileImage[]> | null {
  let lsp3Image: LSP3ProfileImage[] | null;

  if (Array.isArray(image)) {
    lsp3Image = image ?? null;
  } else if (image) {
    lsp3Image = await imageUpload(image, uploadOptions);
  }

  return lsp3Image;
}

async function resizeBuffer(
  imageBuffer: Buffer,
  format: SupportedImageBufferFormats,
  size: number
): Promise<Buffer> {
  const image = await Jimp.read(imageBuffer);
  return image.resize(size, size).getBufferAsync(format);
}
