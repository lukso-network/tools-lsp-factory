import imageCompression from 'browser-image-compression';
import { keccak256 } from 'ethers/lib/utils';

import { ImageBuffer, ImageMetadata } from '../interfaces';
import { AssetBuffer, AssetMetadata } from '../interfaces/metadata';
import { assertUploadProvider, UploadProvider } from '../interfaces/profile-upload-options';

export const defaultSizes = [1800, 1024, 640, 320, 180];
export async function imageUpload(
  givenFile: File | ImageBuffer,
  uploadProvider: UploadProvider,
  sizes?: number[]
): Promise<ImageMetadata[]> {
  const type = 'type' in givenFile ? givenFile.type : givenFile.mimeType;
  const isImage = type?.substr(0, 6) === 'image/';
  if (!isImage) {
    throw new Error(`File type: '${type}' does not start with 'image/'`);
  }
  uploadProvider = assertUploadProvider(uploadProvider);

  sizes = sizes ?? defaultSizes;

  return Promise.all(
    sizes.map(async (size) => {
      let imgToUpload, imgBuffer, width: number, height: number;

      if ('buffer' in givenFile) {
        throw new Error('Buffer image upload is depricated');
        // imgBuffer = await resizeBuffer(givenFile.buffer, givenFile.mimeType, size);
        // imgToUpload = imgBuffer;

        // const resizedDimensions = imageSize(imgBuffer);
        // height = resizedDimensions.height;
        // width = resizedDimensions.width;
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

      const url = await uploadProvider(imgToUpload);

      return {
        width,
        height,
        hashFunction: 'keccak256(bytes)',
        hash: keccak256(imgBuffer),
        url: url.toString(),
      };
    })
  );
}

export async function assetUpload(
  asset: File | AssetBuffer,
  uploadProvider?: UploadProvider
): Promise<AssetMetadata> {
  uploadProvider = assertUploadProvider(uploadProvider);

  let fileBuffer;
  let fileType: string;
  if ('buffer' in asset) {
    fileBuffer = asset.buffer;
    fileType = asset.mimeType;
  } else {
    fileBuffer = new Uint8Array(await asset.arrayBuffer());
    fileType = asset.type;
  }

  const url = await uploadProvider(fileBuffer);

  return {
    hashFunction: 'keccak256(bytes)',
    hash: keccak256(fileBuffer),
    url: url.toString(),
    fileType,
  };
}

export async function prepareMetadataImage(
  uploadProvider: UploadProvider,
  image?: File | ImageBuffer | ImageMetadata[],
  sizes?: number[]
): Promise<ImageMetadata[]> {
  uploadProvider = assertUploadProvider(uploadProvider);
  let metadataImage: ImageMetadata[] = [];

  if (Array.isArray(image)) {
    metadataImage = image;
  } else if (image) {
    metadataImage = await imageUpload(image, uploadProvider, sizes);
  }

  return metadataImage;
}

export async function prepareMetadataAsset(
  asset: File | AssetBuffer | AssetMetadata,
  uploadProvider?: UploadProvider
): Promise<AssetMetadata> {
  uploadProvider = assertUploadProvider(uploadProvider);

  let assetMetadata: AssetMetadata | null = null as unknown as AssetMetadata;
  if ('hashFunction' in asset) {
    assetMetadata = asset ?? null;
  } else if (asset) {
    assetMetadata = await assetUpload(asset, uploadProvider);
  }
  return assetMetadata;
}

// export async function resizeBuffer(buffer: Buffer, format: string, size: number): Promise<Buffer> {
//   const image = await Jimp.read(buffer);
//   return image.scaleToFit(size, size).getBufferAsync(format);
// }

export function isMetadataEncoded(metdata: string): boolean {
  if (
    metdata.startsWith('0x') &&
    !metdata.startsWith('ipfs://') &&
    !metdata.startsWith('https://')
  ) {
    return true;
  }

  return false;
}
