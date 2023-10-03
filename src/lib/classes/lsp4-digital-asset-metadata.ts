import { prepareMetadataAsset, prepareMetadataImage } from '../helpers/uploader.helper';
import { LSPFactoryOptions } from '../interfaces';
import {
  LSP4MetadataBeforeUpload,
  LSP4MetadataContentBeforeUpload,
  LSP4MetadataUrlForEncoding,
} from '../interfaces/lsp4-digital-asset';
import { assertUploadProvider, UploadProvider } from '../interfaces/profile-upload-options';

export class LSP4DigitalAssetMetadata {
  options: LSPFactoryOptions;

  constructor(options: LSPFactoryOptions) {
    this.options = options;
  }

  static async uploadMetadata(
    metaData: LSP4MetadataContentBeforeUpload | LSP4MetadataBeforeUpload,
    uploadProvider: UploadProvider
  ): Promise<LSP4MetadataUrlForEncoding> {
    uploadProvider = assertUploadProvider(uploadProvider);

    metaData = 'LSP4Metadata' in metaData ? metaData.LSP4Metadata : metaData;

    const [images, assets, icon] = await Promise.all([
      metaData.images
        ? Promise.all(metaData.images.map((image) => prepareMetadataImage(uploadProvider, image)))
        : null,
      metaData.assets
        ? Promise.all(metaData.assets?.map((asset) => prepareMetadataAsset(asset, uploadProvider)))
        : null,
      prepareMetadataImage(uploadProvider, metaData.icon, [256, 32]),
    ]);

    const lsp4Metadata = {
      LSP4Metadata: {
        ...metaData,
        links: metaData.links ?? null,
        images,
        assets,
        icon,
      },
    };

    const url = await uploadProvider(Buffer.from(JSON.stringify(lsp4Metadata)));

    return {
      json: lsp4Metadata,
      url: url.toString(),
    };
  }

  async uploadMetadata(
    metaData: LSP4MetadataContentBeforeUpload | LSP4MetadataBeforeUpload,
    uploadProvider?: UploadProvider
  ) {
    return LSP4DigitalAssetMetadata.uploadMetadata(metaData, uploadProvider);
  }
}
