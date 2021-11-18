# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.1.4](https://github.com/lukso-network/tools-lsp-factory/compare/v1.0.2-alpha.8...v1.1.4) (2021-11-18)


### Features

* init base contracts on deploy ([#24](https://github.com/lukso-network/tools-lsp-factory/issues/24)) ([63821da](https://github.com/lukso-network/tools-lsp-factory/commit/63821da95684c68555075004754ffdde1a3da4b4))


### Bug Fixes

* add missing types files in build ([#25](https://github.com/lukso-network/tools-lsp-factory/issues/25)) ([01eb05d](https://github.com/lukso-network/tools-lsp-factory/commit/01eb05d724ea48729646cf165efa01812cc77016)), closes [/github.com/dethcrypto/TypeChain/issues/430#issuecomment-964314162](https://github.com/lukso-network//github.com/dethcrypto/TypeChain/issues/430/issues/issuecomment-964314162)
* npm publish add .json file ([#15](https://github.com/lukso-network/tools-lsp-factory/issues/15)) ([ab52949](https://github.com/lukso-network/tools-lsp-factory/commit/ab529499b231a9fcf6d44edde6c592192832646d))
* set UniversalReceiverDelegate key to setData ([#35](https://github.com/lukso-network/tools-lsp-factory/issues/35)) ([4a25e1c](https://github.com/lukso-network/tools-lsp-factory/commit/4a25e1c73ca85d99d289302ac91cda5d4e5100d0))
* setData tx ([#17](https://github.com/lukso-network/tools-lsp-factory/issues/17)) ([b5b7cd7](https://github.com/lukso-network/tools-lsp-factory/commit/b5b7cd79d11212bad61b1f8bcda63dec24ea4294))

### [1.1.3](https://github.com/lukso-network/tools-lsp-factory/compare/v1.0.2-alpha.8...v1.1.3) (2021-11-17)


### Features

* init base contracts on deploy ([#24](https://github.com/lukso-network/tools-lsp-factory/issues/24)) ([63821da](https://github.com/lukso-network/tools-lsp-factory/commit/63821da95684c68555075004754ffdde1a3da4b4))


### Bug Fixes

* add missing types files in build ([#25](https://github.com/lukso-network/tools-lsp-factory/issues/25)) ([01eb05d](https://github.com/lukso-network/tools-lsp-factory/commit/01eb05d724ea48729646cf165efa01812cc77016)), closes [/github.com/dethcrypto/TypeChain/issues/430#issuecomment-964314162](https://github.com/lukso-network//github.com/dethcrypto/TypeChain/issues/430/issues/issuecomment-964314162)
* npm publish add .json file ([#15](https://github.com/lukso-network/tools-lsp-factory/issues/15)) ([ab52949](https://github.com/lukso-network/tools-lsp-factory/commit/ab529499b231a9fcf6d44edde6c592192832646d))
* setData tx ([#17](https://github.com/lukso-network/tools-lsp-factory/issues/17)) ([b5b7cd7](https://github.com/lukso-network/tools-lsp-factory/commit/b5b7cd79d11212bad61b1f8bcda63dec24ea4294))

### [1.1.2](https://github.com/lukso-network/tools-lspFactory/compare/v1.0.2-alpha.8...v1.1.2) (2021-11-02)


### Bug Fixes

* npm publish add .json file ([#15](https://github.com/lukso-network/tools-lspFactory/issues/15)) ([ab52949](https://github.com/lukso-network/tools-lspFactory/commit/ab529499b231a9fcf6d44edde6c592192832646d))
* setData tx ([#17](https://github.com/lukso-network/tools-lspFactory/issues/17)) ([b5b7cd7](https://github.com/lukso-network/tools-lspFactory/commit/b5b7cd79d11212bad61b1f8bcda63dec24ea4294))

### 1.1.1 (2021-11-02)


### ⚠ BREAKING CHANGES

* **constructor:** move chainId to SignerOptions object
* **controller permissions:** pass controller permissions in deploy function
* **lsp-factory:** Swap provider and signer constructors
* **deploy:** Make deploy return promise and add deployReactive function

### Features

* **base contracts:** add deployBaseContracts method ([567c24a](https://github.com/lukso-network/tools-lspFactory/commit/567c24a502dbb22faa7a3bcb7e2dd27b34cae32f))
* **base contracts:** Deploy base contract if not yet deployed ([a737992](https://github.com/lukso-network/tools-lspFactory/commit/a737992cd4c773dc5e481390a01b5916bd97a7b3))
* **base contracts:** use newly deployed base contracts if default addresses are empty ([3f14f54](https://github.com/lukso-network/tools-lspFactory/commit/3f14f54764f5b108901cc551a521c918c8e168ea))
* **constructor:** allow private key and RPC url strings as LSPFactory construtors ([e783d35](https://github.com/lukso-network/tools-lspFactory/commit/e783d35cacb5f8ecd31623770003cec97ab23e5c))
* **deploy:** Make deploy return promise and add deployReactive function ([eb8df4f](https://github.com/lukso-network/tools-lspFactory/commit/eb8df4f7d835d1523f6755c20522780730f0c645))
* **deploymentEvent:** add base contract deploymenet events ([351cb4f](https://github.com/lukso-network/tools-lspFactory/commit/351cb4fc760ba240eceeb518c44e75140559f79f))
* **digital-asset:** add LSP7 and LSP8 deployment ([80666b2](https://github.com/lukso-network/tools-lspFactory/commit/80666b28eacf5caed6cd27a7242dfcea266a0027))
* **github-workflows:** add github workflow for npm test ([477a6cd](https://github.com/lukso-network/tools-lspFactory/commit/477a6cd1d79b653fccb9e8d9a2e0b5562131725e))
* **LSP3:** allow File object or LSP3 ready images to be passed ([e89b747](https://github.com/lukso-network/tools-lspFactory/commit/e89b747dd25e018d179d811ad1b81423d95bdb51))
* **LSP3:** allow nullable LSP3 data ([11cc53b](https://github.com/lukso-network/tools-lspFactory/commit/11cc53b7ff77c38293545c5a01c64f7d7850b9bb))
* **lsp3:** upload lsp3 data to ipfs while deploying ([0d9c0ba](https://github.com/lukso-network/tools-lspFactory/commit/0d9c0ba3b5410ed4b314460f00a3f656c2d66db7))
* **lsp7:** add proxy deployment of lsp7 ([b8726c5](https://github.com/lukso-network/tools-lspFactory/commit/b8726c51f16d691f61fbbafee5fd6ae5cf93b15b))
* **lsp8:** add proxy deployment for lsp8 ([2b6eae0](https://github.com/lukso-network/tools-lspFactory/commit/2b6eae0b3057ccb922bc78837a54be17fe521fea))
* **lspFactory:** Add SignerOptions object in constructor ([f6b5fd3](https://github.com/lukso-network/tools-lspFactory/commit/f6b5fd3638c893e168f5b2754e92f1e0f7b81806))
* **profile-deployments:** poc deployment events ([64d777a](https://github.com/lukso-network/tools-lspFactory/commit/64d777ab15d9708d2cc982d33ac9a7901cf52b5e))
* **profile-proxy-deployments:** initial alpha version ([e883d08](https://github.com/lukso-network/tools-lspFactory/commit/e883d08b6f0cc1ddbc1cbfeac8468fe52c849259))
* **profile-upload:** alpha version of image upload ([c72af0c](https://github.com/lukso-network/tools-lspFactory/commit/c72af0cfe20cbe2e17adc73373402692940fab1b))
* **signer permissions:** Set user defined signer permissions on KeyManager when deploying ([3f5e1f0](https://github.com/lukso-network/tools-lspFactory/commit/3f5e1f0c726aef73cfedfad3c04ef43337f77ff3))


### Bug Fixes

* **config-helper:** use the correct keys ([47ea967](https://github.com/lukso-network/tools-lspFactory/commit/47ea967ac94f53869dcdd8b64b5d5897bd42d521))
* correct npm version regression ([848ff69](https://github.com/lukso-network/tools-lspFactory/commit/848ff69cc6ddf50182497f4b538421b4ee7ac66e))
* **lsp3-upload:** remove File type check ([d5825d1](https://github.com/lukso-network/tools-lspFactory/commit/d5825d1d02c8e325580e6d48c882483fb283d7a1))
* npm publish add .json file ([#15](https://github.com/lukso-network/tools-lspFactory/issues/15)) ([ab52949](https://github.com/lukso-network/tools-lspFactory/commit/ab529499b231a9fcf6d44edde6c592192832646d))
* **package-lock:** fix broken package lock ([3facec6](https://github.com/lukso-network/tools-lspFactory/commit/3facec612adc66775d23d8e4794490b95db2fc09))
* **profile-deployment:** fix proxy initialization ([699417a](https://github.com/lukso-network/tools-lspFactory/commit/699417ae5e9c5cd6fca8d11561b0887fe7e82f70))
* proxy deployer test ([6cd79a8](https://github.com/lukso-network/tools-lspFactory/commit/6cd79a8cf95f78bd9f20cab0e544bdebf00bc41e))
* setData tx ([#17](https://github.com/lukso-network/tools-lspFactory/issues/17)) ([b5b7cd7](https://github.com/lukso-network/tools-lspFactory/commit/b5b7cd79d11212bad61b1f8bcda63dec24ea4294))


* **constructor:** move chainId to SignerOptions object ([ac5c09b](https://github.com/lukso-network/tools-lspFactory/commit/ac5c09bf6208c429c26d8f5c33d852667b92aa14))
* **controller permissions:** pass controller permissions in deploy function ([47fc329](https://github.com/lukso-network/tools-lspFactory/commit/47fc329f9feed70c28beeab07fb6751e6a37afaf))
* **lsp-factory:** Swap provider and signer constructors ([83b97d8](https://github.com/lukso-network/tools-lspFactory/commit/83b97d8dc15c4bd24c6577928587598ae0ba6759))
