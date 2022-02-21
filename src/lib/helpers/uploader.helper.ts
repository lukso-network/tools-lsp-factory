import imageCompression from 'browser-image-compression';
import { keccak256 } from 'ethers/lib/utils';
import imageSize from 'image-size';
import { AddResult } from 'ipfs-core-types/src/root';
import { ImportCandidate } from 'ipfs-core-types/src/utils';
import { create, Options } from 'ipfs-http-client';
import Jimp from 'jimp';

import { LSP3ProfileImage } from '../interfaces';
import { ImageBuffer } from '../interfaces/lsp3-profile';
import { ProfileUploadOptions } from '../interfaces/profile-upload-options';

export const sizes = [1800, 1024, 640, 320, 180];
export async function imageUpload(
  givenFile: File | ImageBuffer,
  uploadOptions: ProfileUploadOptions
): Promise<LSP3ProfileImage[]> {
  const type = 'type' in givenFile ? givenFile.type : givenFile.mimeType;
  const isImage = type?.substr(0, 6) === 'image/';
  if (!isImage) {
    throw new Error(`File type: '${type}' does not start with 'image/'`);
  }

  return Promise.all(
    sizes.map(async (size) => {
      let imgToUpload, imgBuffer, width: number, height: number;

      if ('buffer' in givenFile) {
        imgBuffer = await resizeBuffer(givenFile.buffer, givenFile.mimeType, size);
        imgToUpload = imgBuffer;

        const resizedDimensions = imageSize(imgBuffer);
        height = resizedDimensions.height;
        width = resizedDimensions.width;
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

      let uploadResponse;
      if (uploadOptions.url) {
        // TODO: add simple HTTP upload
      } else {
        uploadResponse = await ipfsUpload(imgToUpload, uploadOptions.ipfsClientOptions);
      }

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

export async function resizeBuffer(buffer: Buffer, format: string, size: number): Promise<Buffer> {
  const image = await Jimp.read(buffer);
  return image.scaleToFit(size, size).getBufferAsync(format);
}
