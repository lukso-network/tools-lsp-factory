---
sidebar_position: 1.1
title: Universal Profile
---

# Deploying Universal Profile

## Constructing LSP3 Metadata

A Universal Profile is composed of an [ERC725Account](../../../standards/universal-profile/lsp0-erc725account) contract with some [LSP3 Universal Profile Metadata](../../../standards/universal-profile/lsp3-universal-profile-metadata) attached. The metadata forms the 'face' of your profile and is what contains information such as your profile name, description and profile image.

When deploying a Universal Profile with LSPFactory you can specify your Universal Profile metadata using the `lsp3Profile` key in the profile options object:

```javascript
await lspFactory.LSP3UniversalProfile.deploy({
    controllingAccounts: ['0x...'],
    lsp3Profile: myUniversalProfileData
  });
};
```

:::info Info
Profile Metadata can be passed as either an object contianing the profile details you want to upload, or an IPFS url of your previously uploaded metadata.
:::

If an object is passed, LSPFactory will process and upload your metadata to IPFS. See [Contract Deployment Options](./contract-deployment-options) for details on how to specify a custom IPFS gateway.

```javascript title='Setting LSP3 metadata to be uploaded'
const myUniversalProfileData = {
  name: 'My Universal Profile',
  description: 'My cool Universal Profile',
  tags: ['public-profile'],
  links: [{ title: 'My Website', url: 'www.my-website.com' }],
};

await lspFactory.LSP3UniversalProfile.deploy({
    controllingAccounts: ['0x...'],
    lsp3Profile: myUniversalProfileData
  });
};
```

```javascript title='Setting LSP3 metadata using metadata IPFS url'
await lspFactory.LSP3UniversalProfile.deploy({
    controllingAccounts: ['0x...'],
    lsp3Profile: 'ipfs://QmQ7Wq4y2gWiuzB4a4Wd6UiidKNpzCJRpgzFqQwzyq6SsV'
  });
};
```

```javascript title='Setting LSP3 metadata using metadata IPFS url'
await lspFactory.LSP3UniversalProfile.deploy({
    controllingAccounts: ['0x...'],
    lsp3Profile: 'https://ipfs.lukso.network/ipfs/QmRzUfdKhY6vhcTNDnitwKnnpm5GqjYSmw9tcdNVmi4bqy'
  });
};
```

## Setting Profile and Background Images

`profileImage` and `backgroundImage` can be passed inside the `lsp3Profile` object . These can be passed as an object containing previously uploaded Image Metadata, a Javascript `File` object if being used client-side or `ImageBuffer` if the library is being used in a Nodejs environment.

### Using Image Metadata

An LSP3 Profile requires `profileImage` and `backgroundImage` to be uploaded in multiple sizes so that interfaces can choose which one to load for better loading performance.

If you already have an image uploaded to IPFS in multiple sizes, image metadata can be directly constructed according to [LSP3 Universal Profile Metadata Standard](../../../standards/universal-profile/lsp3-universal-profile-metadata) and passed inside the lsp3Profile object when deploying a Profile.

Both `profileImage` and `backgroundImage` take an Array, where each element is the metadata of a different image size.

```javascript title='Setting LSP3 metadata to be uploaded'
const myUniversalProfileData = {
  name: 'My Universal Profile',
  description: 'My cool Universal Profile',
  profileImage: [
    {
      width: 500,
      height: 500,
      hashFunction: 'keccak256(bytes)',
      hash: '0xfdafad027ecfe57eb4ad047b938805d1dec209d6e9f960fc320d7b9b11cbed14', // bytes32 hex string of the image hash
      url: 'ipfs://QmPLqMFHxiUgYAom3Zg4SiwoxDaFcZpHXpCmiDzxrtjSGp',
    },
    ... // Multiple image sizes should be included
  ],
  backgroundImage: [
    {
      width: 500,
      height: 500,
      hashFunction: 'keccak256(bytes)',
      hash: '0xfdafad027ecfe57eb4ad047b938805d1dec209d6e9f960fc320d7b9b11cbed14', // bytes32 hex string of the image hash
      url: 'ipfs://QmPLqMFHxiUgYAom3Zg4SiwoxDaFcZpHXpCmiDzxrtjSGp',
    },
    ... // Multiple image sizes should be included
  ],
};

await lspFactory.LSP3UniversalProfile.deploy({
    controllingAccounts: ['0x...'],
    lsp3Profile: myUniversalProfileData
  });
};
```

### Using Javascript File object

`File` objects can also be passed to `profileImage` and `backgroundImage` fields to allow easy drag and drop of images from a user interface.

:::caution
Javascript's `File` object is only available client-side. If using LSPFactory in a Node environment Images should be uploaded as an [ImageBuffer](./universal-profile#uploading-an-image-using-imagebuffer)
:::

```javascript
<input type="file" id="input">

<script>
    const myLocalFile = document.getElementById('input').files[0];

    const myUniversalProfileData = {
        name: "My Universal Profile",
        description: "My cool Universal Profile",
        profileImage: myLocalFile,
        backgroundImage: myLocalFile,
        tags: ['Fashion', 'Design'],
        links: [{ title: "My Website", url: "www.my-website.com" }],
    };

    await lspFactory.LSP3UniversalProfile.deploy({
      controllingAccounts: ['0x...'],
      lsp3Profile: myUniversalProfileData
    });
};
<script/>
```

LSPFactory will create 5 resized versions of the passed image, with max sizes of 1800x1800, 1024x1024, 640x640, 320x320, 180x180. These resized images will be uploaded to IPFS and the metadata set in the LSP3 Profile.

### Using Image Buffer

If using LSPFactory in a Node environment where Javascript `File` object is not available, `profileImage` and `backgroundImage` can be uploaded by passing a File Buffer directly. The image mimetype must also be passed so that the Image can be reconstructed and resized. Supported mimetypes can be easily accessed by using the `SupportedImageBufferFormats` enum.

```javascript
const profileImageBuffer = fs.readFileSync('./my-profile-image.png');
const backgroundImageBuffer = fs.readFileSync('./my-background-image.png');

const myUniversalProfileData = {
  name: 'My Universal Profile',
  description: 'My cool Universal Profile',
  profileImage: {
    buffer: profileImageBuffer,
    mimeType: SupportedImageBufferFormats.png,
  },
  backgroundImage: {
    buffer: backgroundImageBuffer,
    mimeType: SupportedImageBufferFormats.png,
  },
};

await lspFactory.LSP3UniversalProfile.deploy({
  controllingAccounts: ['0x...'],
  lsp3Profile: myUniversalProfileData,
});
```

## Uploading LSP3 metadata to IPFS

If you wish to upload your LSP3 metadata before deploying you can do so using the static `uploadProfileData` method. This uses the same `lsp3Profile` object schema defined above when deploying a Universal Profile:

```javascript
const uploadResult = await lspFactory.LSP3UniversalProfile.uploadProfileData({
  ...myUniversalProfileData,
});

const myUniversalProfileIPFSUrl = uploadResult.url; // 'https://ipfs.lukso.network/ipfs/QmPzUfdKhY6vfcTNDnitwKnnpm5GqjYSmw9todNVmi4bqy'
```

## Deploy your UniversalProfile

```javascript
import { LSPFactory } from '@lukso/lsp-factory.js';

const lspFactory = new LSPFactory('https://rpc.l14.lukso.network', {
  '0x...',
  22,
});

const myContracts = await lspFactory.LSP3UniversalProfile.deploy({
    controllingAccounts: ['0x...'],
    lsp3Profile: myUniversalProfileIPFSUrl | myUniversalProfileData // LSP3 Metadata object or IPFS URL
  });
};
```
