import { defaultUploadOptions } from '../helpers/config.helper';
import { ipfsUpload, prepareMetadataAsset, prepareMetadataImage } from '../helpers/uploader.helper';
import { ImageMetadata, LSPFactoryOptions } from '../interfaces';
import {
  LSP4MetadataBeforeUpload,
  LSP4MetadataContentBeforeUpload,
  LSP4MetadataUrlForEncoding,
} from '../interfaces/lsp4-digital-asset';
import { AssetMetadata } from '../interfaces/metadata';
import { UploadOptions } from '../interfaces/profile-upload-options';

export class LSP4DigitalAssetMetadata {
  options: LSPFactoryOptions;

  constructor(options: LSPFactoryOptions) {
    this.options = options;
  }

  static async uploadMetadata(
    metaData: LSP4MetadataContentBeforeUpload | LSP4MetadataBeforeUpload,
    uploadOptions?: UploadOptions
  ): Promise<LSP4MetadataUrlForEncoding> {
    uploadOptions = uploadOptions || defaultUploadOptions;

    metaData = 'LSP4Metadata' in metaData ? metaData.LSP4Metadata : metaData;

    const [images, assets, icon] = await Promise.all([
      metaData.images
        ? Promise.all(metaData.images.map((image) => prepareMetadataImage(uploadOptions, image)))
        : undefined,
      metaData.assets
        ? Promise.all(metaData.assets?.map((asset) => prepareMetadataAsset(asset, uploadOptions)))
        : undefined,
      prepareMetadataImage(uploadOptions, metaData.icon, [256, 32]),
    ]);

    const lsp4Metadata = {
      LSP4Metadata: {
        ...metaData,
        links: metaData.links ?? [],
        images: (images ?? []).filter((image) => image) as ImageMetadata[][],
        assets: (assets ?? []).filter((asset) => asset) as AssetMetadata[],
        icon: icon?.filter((image) => image) as ImageMetadata[],
      },
    };

    let uploadResponse;
    if (uploadOptions.url) {
      // TODO: implement simple HTTP upload
    } else {
      uploadResponse = await ipfsUpload(JSON.stringify(lsp4Metadata), uploadOptions?.ipfsGateway);
    }

    return {
      json: lsp4Metadata,
      url: uploadResponse.cid ? 'ipfs://' + uploadResponse.cid : 'https upload TBD',
    };
  }

  async uploadMetadata(
    metaData: LSP4MetadataContentBeforeUpload | LSP4MetadataBeforeUpload,
    uploadOptions?: UploadOptions
  ) {
    uploadOptions = uploadOptions || this.options.uploadOptions || defaultUploadOptions;
    return LSP4DigitalAssetMetadata.uploadMetadata(metaData, uploadOptions);
  }
}
