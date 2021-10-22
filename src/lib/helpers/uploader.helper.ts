import imageCompression from 'browser-image-compression';
import { keccak256 } from 'ethers/lib/utils';
import { AddResult } from 'ipfs-core-types/src/root';
import { ImportCandidate } from 'ipfs-core-types/src/utils';
import { create, Options } from 'ipfs-http-client';

import { LSP3ProfileImage } from '../interfaces';
import { ProfileUploadOptions } from '../interfaces/profile-upload-options';

export const sizes = [1800, 1024, 640, 320, 180];
export async function imageUpload(
  givenFile: File,
  uploadOptions: ProfileUploadOptions
): Promise<LSP3ProfileImage[]> {
  const isImage = givenFile.type?.substr(0, 6) === 'image/';
  if (!isImage) {
    throw new Error(`File provided is of type "${givenFile.type}".`);
  }

  return Promise.all(
    sizes.map(async (size) => {
      const img = await imageCompression(givenFile, {
        maxWidthOrHeight: size,
        useWebWorker: true,
      });

      const imgBuffer = new Uint8Array(await img.arrayBuffer());
      const loadedImg = await imageCompression.drawFileInCanvas(img);
      const uploadResponse = await ipfsUpload(img, uploadOptions.ipfsClientOptions);

      return {
        width: loadedImg[0].width,
        height: loadedImg[0].height,
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
  image?: File | LSP3ProfileImage[]
): Promise<LSP3ProfileImage[]> | null {
  let lsp3Image: LSP3ProfileImage[] | null;

  if (image instanceof File) {
    lsp3Image = await imageUpload(image, uploadOptions);
  } else {
    lsp3Image = image ?? null;
  }

  return lsp3Image;
}
