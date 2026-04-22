# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.3.4](https://github.com/lukso-network/tools-lsp-factory/compare/lsp-factory.js-v3.3.3...lsp-factory.js-v3.3.4) (2026-04-22)


### Documentation

* overhaul README — clear intro, Universal Profiles + LSP7 + LSP8 all covered ([9cdf15d](https://github.com/lukso-network/tools-lsp-factory/commit/9cdf15df6821095600192514aa9f34d7d9f4f66e))

## [3.3.3](https://github.com/lukso-network/tools-lsp-factory/compare/lsp-factory.js-v3.3.2...lsp-factory.js-v3.3.3) (2026-04-16)


### Bug Fixes

* Attempt npx npm@latest ([6559874](https://github.com/lukso-network/tools-lsp-factory/commit/65598742ba3681f297b3e60d0b57db49f747b9bb))

## [3.3.2](https://github.com/lukso-network/tools-lsp-factory/compare/lsp-factory.js-v3.3.1...lsp-factory.js-v3.3.2) (2026-04-16)


### Bug Fixes

* Repair by removing the read of NPM_TOKEN ([0841bde](https://github.com/lukso-network/tools-lsp-factory/commit/0841bde822977233db1c3e8f27708673bff58e35))

## [3.3.1](https://github.com/lukso-network/tools-lsp-factory/compare/lsp-factory.js-v3.3.0...lsp-factory.js-v3.3.1) (2026-04-16)


### Bug Fixes

* Cleanup lint ([7eabcf4](https://github.com/lukso-network/tools-lsp-factory/commit/7eabcf47364c9fc23fbe9f4269cb20e8d4d91910))
* swap eslint-plugin-import for eslint-plugin-import-x ([62a9b96](https://github.com/lukso-network/tools-lsp-factory/commit/62a9b965a48f23ee945562b34bc38ec5d61394c0))

## [3.3.0](https://github.com/lukso-network/tools-lsp-factory/compare/lsp-factory.js-v4.0.0...lsp-factory.js-v3.3.0) (2026-04-16)


### ⚠ BREAKING CHANGES

* Major v4 refactor of @lukso/lsp-factory.js
* upgrade `@lukso/lsp-smart-contracts` to v0.14.0 ([#247](https://github.com/lukso-network/tools-lsp-factory/issues/247))
* add tokenIdType to LSP8 deployment
* update LSP3 and LSP4 to new verification schema
* upgrade lsp to v0.11.1
* upgrade smart contracts to v0.10.3 ([#204](https://github.com/lukso-network/tools-lsp-factory/issues/204))
* update base contract addresses
* upgrade lsp-smart-contracts to 0.8.0
* Upgrade lsp-smart-contracts to v0.7.0 ([#163](https://github.com/lukso-network/tools-lsp-factory/issues/163))
* remove reactiveDeployment ([#120](https://github.com/lukso-network/tools-lsp-factory/issues/120))
* rename LSP3UniversalProfile -> UniversalProfile ([#119](https://github.com/lukso-network/tools-lsp-factory/issues/119))
* use full universal profile contract names ([#118](https://github.com/lukso-network/tools-lsp-factory/issues/118))
* Adds contract object to digital asset options object
* flatten upload options object to just ipfsClientOptions
* use version key for UP contract config options
* use version key for digital asset contract config options
* remove jjmp and imge-size
* add deployProxy flag functionality to LSP8 deployment
* remove deployBaseContract method
* split LSP7/LSP8 DigitalAsset classes
* split LSP7/LSP8 DigitalAsset classes
* **lsp3:** rename UP controllerAccounts controllerAddresses
* **constructor:** move chainId to SignerOptions object
* **controller permissions:** pass controller permissions in deploy function
* **lsp-factory:** Swap provider and signer constructors
* **deploy:** Make deploy return promise and add deployReactive function

### improvement

* remove reactiveDeployment ([#120](https://github.com/lukso-network/tools-lsp-factory/issues/120)) ([8ea2eb3](https://github.com/lukso-network/tools-lsp-factory/commit/8ea2eb36ead007c0282034f971868e0c90339d3b))
* rename LSP3UniversalProfile -&gt; UniversalProfile ([#119](https://github.com/lukso-network/tools-lsp-factory/issues/119)) ([feac758](https://github.com/lukso-network/tools-lsp-factory/commit/feac7581f8f6197ec6e3cd742db29fd89d3f2d6a))
* use full universal profile contract names ([#118](https://github.com/lukso-network/tools-lsp-factory/issues/118)) ([12cef50](https://github.com/lukso-network/tools-lsp-factory/commit/12cef504bebc5c5e1fccdb1200205bfa04d95ee0))
* use version key for digital asset contract config options ([dd91795](https://github.com/lukso-network/tools-lsp-factory/commit/dd91795dd20bca05f86b7c6a03971d1a3b4fe3c4))
* use version key for UP contract config options ([5e780e5](https://github.com/lukso-network/tools-lsp-factory/commit/5e780e5c9a3f082348800672100d0617bd776114))


### improvemenet

* Adds contract object to digital asset options object ([bf01091](https://github.com/lukso-network/tools-lsp-factory/commit/bf01091b7110cf7ee6492aaf13f5bc51f90c3d43))


### Features

* add `keccak256(utf8)` constant in helpers ([16b66ca](https://github.com/lukso-network/tools-lsp-factory/commit/16b66ca6189c4c9cbc200df32203b9382538d7cd))
* add avatar to LSP3 upload ([#121](https://github.com/lukso-network/tools-lsp-factory/issues/121)) ([e278d5a](https://github.com/lukso-network/tools-lsp-factory/commit/e278d5a69bf667cbb5bced47976250a644384b78))
* add base contract addresses on L16 ([89c1358](https://github.com/lukso-network/tools-lsp-factory/commit/89c13585224ae8e4767111e3806316ed133f44e1))
* add multiple controller addresses on deployment ([fff32f2](https://github.com/lukso-network/tools-lsp-factory/commit/fff32f2545f6205f46cb4ea15ba5b5d89f4dc6d6))
* add multiple controller addresses on deployment ([dd81fe6](https://github.com/lukso-network/tools-lsp-factory/commit/dd81fe695864331b2e170225b3a6ec34950e9d92))
* allow passing lsp3 data straight to erc725.js for encoding ([a431360](https://github.com/lukso-network/tools-lsp-factory/commit/a4313602d16d8f6828c3db9e798c60a6cc0e1f4a))
* allow passing lsp4metadata to erc725 js for encoding ([02ed239](https://github.com/lukso-network/tools-lsp-factory/commit/02ed2399e03c4efe43152ec15f8a69ea4d3c26f9))
* allow passing window.ethereum object during instantiation ([649f9d7](https://github.com/lukso-network/tools-lsp-factory/commit/649f9d7ff32239b74383bbea4394389ccb5bff88))
* **base contracts:** add deployBaseContracts method ([567c24a](https://github.com/lukso-network/tools-lsp-factory/commit/567c24a502dbb22faa7a3bcb7e2dd27b34cae32f))
* **base contracts:** Deploy base contract if not yet deployed ([a737992](https://github.com/lukso-network/tools-lsp-factory/commit/a737992cd4c773dc5e481390a01b5916bd97a7b3))
* **base contracts:** use newly deployed base contracts if default addresses are empty ([3f14f54](https://github.com/lukso-network/tools-lsp-factory/commit/3f14f54764f5b108901cc551a521c918c8e168ea))
* **constructor:** allow private key and RPC url strings as LSPFactory construtors ([e783d35](https://github.com/lukso-network/tools-lsp-factory/commit/e783d35cacb5f8ecd31623770003cec97ab23e5c))
* **deploy:** Make deploy return promise and add deployReactive function ([eb8df4f](https://github.com/lukso-network/tools-lsp-factory/commit/eb8df4f7d835d1523f6755c20522780730f0c645))
* **deploymentEvent:** add base contract deploymenet events ([351cb4f](https://github.com/lukso-network/tools-lsp-factory/commit/351cb4fc760ba240eceeb518c44e75140559f79f))
* **digital-asset:** add LSP7 and LSP8 deployment ([80666b2](https://github.com/lukso-network/tools-lsp-factory/commit/80666b28eacf5caed6cd27a7242dfcea266a0027))
* init base contracts on deploy ([#24](https://github.com/lukso-network/tools-lsp-factory/issues/24)) ([63821da](https://github.com/lukso-network/tools-lsp-factory/commit/63821da95684c68555075004754ffdde1a3da4b4))
* **LSP3:** allow File object or LSP3 ready images to be passed ([e89b747](https://github.com/lukso-network/tools-lsp-factory/commit/e89b747dd25e018d179d811ad1b81423d95bdb51))
* **LSP3:** allow nullable LSP3 data ([11cc53b](https://github.com/lukso-network/tools-lsp-factory/commit/11cc53b7ff77c38293545c5a01c64f7d7850b9bb))
* **lsp3:** upload lsp3 data to ipfs while deploying ([0d9c0ba](https://github.com/lukso-network/tools-lsp-factory/commit/0d9c0ba3b5410ed4b314460f00a3f656c2d66db7))
* **lsp7:** add proxy deployment of lsp7 ([b8726c5](https://github.com/lukso-network/tools-lsp-factory/commit/b8726c51f16d691f61fbbafee5fd6ae5cf93b15b))
* **lsp8:** add proxy deployment for lsp8 ([2b6eae0](https://github.com/lukso-network/tools-lsp-factory/commit/2b6eae0b3057ccb922bc78837a54be17fe521fea))
* **lspFactory:** Add SignerOptions object in constructor ([f6b5fd3](https://github.com/lukso-network/tools-lsp-factory/commit/f6b5fd3638c893e168f5b2754e92f1e0f7b81806))
* **signer permissions:** Set user defined signer permissions on KeyManager when deploying ([3f5e1f0](https://github.com/lukso-network/tools-lsp-factory/commit/3f5e1f0c726aef73cfedfad3c04ef43337f77ff3))
* upgrade lsp to v0.11.1 ([ccc61f8](https://github.com/lukso-network/tools-lsp-factory/commit/ccc61f855028c617767f726e317298ee65ee358a))
* Upgrade lsp-smart-contracts to v0.7.0 ([#163](https://github.com/lukso-network/tools-lsp-factory/issues/163)) ([761cd81](https://github.com/lukso-network/tools-lsp-factory/commit/761cd81089c55e4ab15d2a6c234ca39e40f3e46a))
* upgrade smart contracts to v0.10.3 ([#204](https://github.com/lukso-network/tools-lsp-factory/issues/204)) ([db9d147](https://github.com/lukso-network/tools-lsp-factory/commit/db9d147df5b11dcb95c7a8249c683db49db2cce0))
* upload image to IPFS from buffer ([f17b911](https://github.com/lukso-network/tools-lsp-factory/commit/f17b911820e277cade73089968fb9566e00d832f))


### Bug Fixes

* Add default api for ipfs. ([2ae904a](https://github.com/lukso-network/tools-lsp-factory/commit/2ae904ad6565d9194fb264ef2a104022f055691f))
* add missing types files in build ([#25](https://github.com/lukso-network/tools-lsp-factory/issues/25)) ([01eb05d](https://github.com/lukso-network/tools-lsp-factory/commit/01eb05d724ea48729646cf165efa01812cc77016))
* add v12 base contract versions ([adbaadc](https://github.com/lukso-network/tools-lsp-factory/commit/adbaadcb2e68a7b0e1e171055165875ebee2e30d))
* add v14 base contracts for mainnet ([2065e79](https://github.com/lukso-network/tools-lsp-factory/commit/2065e79e4b44d2fd1183c2c12f4b1f1a337aa0f4))
* add zero-left padding for `AddressPermissions[]` length ([#55](https://github.com/lukso-network/tools-lsp-factory/issues/55)) ([c6a65bd](https://github.com/lukso-network/tools-lsp-factory/commit/c6a65bd87bef92cb81b46071f5b657b6ecdc76cf))
* Adjust versions of lsp-smart-contracts and erc725.js to match latest. ([c6b04a6](https://github.com/lukso-network/tools-lsp-factory/commit/c6b04a6f27d0aa59bf6d9a910054ec758546031c))
* correct npm version regression ([848ff69](https://github.com/lukso-network/tools-lsp-factory/commit/848ff69cc6ddf50182497f4b538421b4ee7ac66e))
* deploy mintable digital assets ([6b95f07](https://github.com/lukso-network/tools-lsp-factory/commit/6b95f0780290501ad5a4cc788c1e614352ead23a))
* enable source map ([e3c60b3](https://github.com/lukso-network/tools-lsp-factory/commit/e3c60b331c213ce5ce6dec8479b577471345d76e))
* encode LSP2 array length as 16 bytes long ([919c5a4](https://github.com/lukso-network/tools-lsp-factory/commit/919c5a4078169a4a5e60735b6a7d313a8b2ea106))
* erc725.js imports ([1a4e210](https://github.com/lukso-network/tools-lsp-factory/commit/1a4e2108cf81ad646e7f0cfc0571924d863fc889))
* get deployed contract addresses from event logs ([e674f69](https://github.com/lukso-network/tools-lsp-factory/commit/e674f693549d8eaa4b0ecbb39f9bf9424c291e50))
* give permission `REENTRANCY` to LSP1Delegate ([edb0c5e](https://github.com/lukso-network/tools-lsp-factory/commit/edb0c5e665ee22e95a79de6fe429423bd792f693))
* linter error ([455e9a4](https://github.com/lukso-network/tools-lsp-factory/commit/455e9a43c491b8ae691681b1e0e3851fa9369481))
* **lsp3-upload:** remove File type check ([d5825d1](https://github.com/lukso-network/tools-lsp-factory/commit/d5825d1d02c8e325580e6d48c882483fb283d7a1))
* lsp6 keymanager init selector for lsp23 ([d847cb5](https://github.com/lukso-network/tools-lsp-factory/commit/d847cb564f487bb6cceca379232cc13dc1dbb0de))
* make salt optional with random default generation ([8f59cb6](https://github.com/lukso-network/tools-lsp-factory/commit/8f59cb6a09aeb522895b60c65de653c88d1e705a))
* npm publish add .json file ([#15](https://github.com/lukso-network/tools-lsp-factory/issues/15)) ([ab52949](https://github.com/lukso-network/tools-lsp-factory/commit/ab529499b231a9fcf6d44edde6c592192832646d))
* **package-lock:** fix broken package lock ([3facec6](https://github.com/lukso-network/tools-lsp-factory/commit/3facec612adc66775d23d8e4794490b95db2fc09))
* proxy deployer test ([6cd79a8](https://github.com/lukso-network/tools-lsp-factory/commit/6cd79a8cf95f78bd9f20cab0e544bdebf00bc41e))
* readme title ([#256](https://github.com/lukso-network/tools-lsp-factory/issues/256)) ([039583e](https://github.com/lukso-network/tools-lsp-factory/commit/039583e16f92a8379f0f68474822c296b9117779))
* remove unused imports, remove ts-jest peer dep conflict, fix lint ([e8d60c6](https://github.com/lukso-network/tools-lsp-factory/commit/e8d60c6fc2b2c183e7f17c7c6dbcc564811e0e6b))
* Repair .tool-versions to actually match github actions and code ([eca64ba](https://github.com/lukso-network/tools-lsp-factory/commit/eca64ba0315410348d86398a284ff721f6bc8e43))
* Repair IPFS decoding in lsp-factory when using custom authenticated gateway. ([0becba4](https://github.com/lukso-network/tools-lsp-factory/commit/0becba4b673931689dbcb13e80306b65da26ba7d))
* Repaise additional import ([36fe3e9](https://github.com/lukso-network/tools-lsp-factory/commit/36fe3e91b743ff4b328bcb2b88e20d51fc0ad99b))
* set UniversalReceiverDelegate key to setData ([#35](https://github.com/lukso-network/tools-lsp-factory/issues/35)) ([4a25e1c](https://github.com/lukso-network/tools-lsp-factory/commit/4a25e1c73ca85d99d289302ac91cda5d4e5100d0))
* setData tx ([#17](https://github.com/lukso-network/tools-lsp-factory/issues/17)) ([b5b7cd7](https://github.com/lukso-network/tools-lsp-factory/commit/b5b7cd79d11212bad61b1f8bcda63dec24ea4294))
* trigger release ([9f5fdf0](https://github.com/lukso-network/tools-lsp-factory/commit/9f5fdf046523110a411187f08e25b71598798ecd))
* typo in `LinkMetadata` interface ([92c7fb9](https://github.com/lukso-network/tools-lsp-factory/commit/92c7fb9adbe201459528e261867a08480b37d639))
* update contract versions ([223ac8d](https://github.com/lukso-network/tools-lsp-factory/commit/223ac8d7777d17cad9dd6bf10f468571489ce1e6))
* Upgrade and try again ([51895c1](https://github.com/lukso-network/tools-lsp-factory/commit/51895c1a7017728f45cc15b5e7581d1326a76c00))
* use default SC version ([ed4a1a2](https://github.com/lukso-network/tools-lsp-factory/commit/ed4a1a2b85a0e1283ceb2142af64a1d74080d940))
* use new variable name ([c2fbb84](https://github.com/lukso-network/tools-lsp-factory/commit/c2fbb8416b9d543e3843cfad89cffc5fd36d3dd9))


### Code Refactoring

* add tokenIdType to LSP8 deployment ([425e23f](https://github.com/lukso-network/tools-lsp-factory/commit/425e23fea89723cbf7784f500171d1d57109c537))
* extract controllers permissions keys-valuees into variables ([8f11c32](https://github.com/lukso-network/tools-lsp-factory/commit/8f11c32fa7665796406d25402481f497379f6b56))
* extract shared helpers, remove dead code, fix redundant RPC call ([d5e0045](https://github.com/lukso-network/tools-lsp-factory/commit/d5e0045f7b6cb534ba21c75e34c097992a582356))
* fix linter + use ERC725 to encode default permissions ([d3bfc31](https://github.com/lukso-network/tools-lsp-factory/commit/d3bfc31fd0258f610b311d99b101198ebb8f91e5))
* improve types checking and stores keys-values in array variables ([a2e28ec](https://github.com/lukso-network/tools-lsp-factory/commit/a2e28ec8f408eac1188e817fa3d449508a1c8eea))
* move all test files to test/ directory ([c2e5159](https://github.com/lukso-network/tools-lsp-factory/commit/c2e5159dc6a1b14b8af05bbb9098e6863cc9aa96))
* remove DELEGATECALL permission ([002ea73](https://github.com/lukso-network/tools-lsp-factory/commit/002ea730100e5f2a67620986d0090c5e3cea37e7))
* replace ethers.js with viem, remove IPFS, use LSP23 for deployment ([7c3ae5e](https://github.com/lukso-network/tools-lsp-factory/commit/7c3ae5e283ec2cf56af8180b2376e4e5923fb60d))
* update LSP3 and LSP4 to new verification schema ([acaa377](https://github.com/lukso-network/tools-lsp-factory/commit/acaa377db21a53e9f1803ae121b57da68ad49ee2))
* upgrade `@lukso/lsp-smart-contracts` to v0.14.0 ([#247](https://github.com/lukso-network/tools-lsp-factory/issues/247)) ([58edb58](https://github.com/lukso-network/tools-lsp-factory/commit/58edb58069f001169d52547ac8b3a57250a3725c))
* use constants from lsp-smart-contracts and ethers packages ([b0848d2](https://github.com/lukso-network/tools-lsp-factory/commit/b0848d25b123508401f7062605f70a51974d912f))
* use erc725.js to encode permissions ([51174ff](https://github.com/lukso-network/tools-lsp-factory/commit/51174ff70d37e187f6ac3819842fbccebf9c211b))
* use type from erc725.js ([4f98ecf](https://github.com/lukso-network/tools-lsp-factory/commit/4f98ecf601f5dfd1e933ac4fcb3be10b98b72d9e))


### Documentation

* add contract deployment options docs ([d3b1279](https://github.com/lukso-network/tools-lsp-factory/commit/d3b1279aac4b11223808674e430632b3bf47458f))
* add custom classed md docs ([4d9c7be](https://github.com/lukso-network/tools-lsp-factory/commit/4d9c7becbd6c294b7edf8d5e62b6e7742e52b70c))
* add details on using mintable digital asset abi ([6146640](https://github.com/lukso-network/tools-lsp-factory/commit/614664083978ade2888fd774f93eb08bd026a68d))
* add error handling into reactive deployment examples ([#112](https://github.com/lukso-network/tools-lsp-factory/issues/112)) ([a980694](https://github.com/lukso-network/tools-lsp-factory/commit/a980694338da46d7b428015ef759e62fe7f22951))
* add examples to classes md docs ([8b95d77](https://github.com/lukso-network/tools-lsp-factory/commit/8b95d772fc4f89150d12a5394c7e61e39ec8215d))
* add generated technical reference docs ([dd88dbd](https://github.com/lukso-network/tools-lsp-factory/commit/dd88dbd85fe5f5057a9502ebe81ed11683de516e))
* add generic contract options docs ([ae1bd3c](https://github.com/lukso-network/tools-lsp-factory/commit/ae1bd3c3a508220cc19e4438f0e6d8c790155896))
* add instatiation in deployment examples ([048577d](https://github.com/lukso-network/tools-lsp-factory/commit/048577d6eda9e0f1d52d2b1ad887dc4fd1f07194))
* add jsdocs for digital asset and UniversalProfile classes ([ea75408](https://github.com/lukso-network/tools-lsp-factory/commit/ea75408f4dd98abc64ac9748bf133ed4efc000e6))
* add LSP3IssuedAssets warning ([#113](https://github.com/lukso-network/tools-lsp-factory/issues/113)) ([aa6c566](https://github.com/lukso-network/tools-lsp-factory/commit/aa6c56632ae3ac0dc6469bc400b3a8cd0d6923f6))
* add lsp4 upload documentation ([9cc96cb](https://github.com/lukso-network/tools-lsp-factory/commit/9cc96cb6d08af63f384f3d4e53bba2baeb10d069))
* add LSP4Creators array key to docs ([4e6ac19](https://github.com/lukso-network/tools-lsp-factory/commit/4e6ac19c3adac13725d32d58b3b06370b120a234))
* add new digital asset deployment page ([#103](https://github.com/lukso-network/tools-lsp-factory/issues/103)) ([8df9730](https://github.com/lukso-network/tools-lsp-factory/commit/8df9730240f401740836f8da9a629c388fb6b4fa))
* add release documentation ([fc37a99](https://github.com/lukso-network/tools-lsp-factory/commit/fc37a994c09406b1f4656372aca7cc1f9271175d))
* add supported networks section, add Ethereum and BASE chain configs ([99bb157](https://github.com/lukso-network/tools-lsp-factory/commit/99bb1570231f1c02d2111ecccd64668c100ced8b))
* change reference of LSP3 to LSP3-Profile-Metadata ([194a744](https://github.com/lukso-network/tools-lsp-factory/commit/194a744d95c242dc17a23292f7b5f21c4e105f07))
* controllingAccounts -&gt; controllerAddresses ([1af5b51](https://github.com/lukso-network/tools-lsp-factory/commit/1af5b51ed59cbf8348aeb18ed693c608ab8e80b6))
* correct + improve deployment code snippet in README ([#46](https://github.com/lukso-network/tools-lsp-factory/issues/46)) ([b1f6c45](https://github.com/lukso-network/tools-lsp-factory/commit/b1f6c457b7fbd1d6bfbcdf69aa3aadc68012420a))
* correct digital asset example ([579b450](https://github.com/lukso-network/tools-lsp-factory/commit/579b450877c2e3007580d2ba70b178d641f77014))
* fix broken link ([4975c2a](https://github.com/lukso-network/tools-lsp-factory/commit/4975c2a75d824c570998828d3a36c576cc67a308))
* fix broken link ([f016cc8](https://github.com/lukso-network/tools-lsp-factory/commit/f016cc85063e65b645a25ff7f5575da544c52a76))
* fix broken link on lsp3 class page ([#83](https://github.com/lukso-network/tools-lsp-factory/issues/83)) ([18efcab](https://github.com/lukso-network/tools-lsp-factory/commit/18efcabbf5cacfcc13227ca8973ac78ed15a935e))
* fix docs links ([#203](https://github.com/lukso-network/tools-lsp-factory/issues/203)) ([e336b9f](https://github.com/lukso-network/tools-lsp-factory/commit/e336b9fa3025cc96775eae03280a361b55acea9f))
* fix typo and add links tp LSP6 permissions ([e3dcee6](https://github.com/lukso-network/tools-lsp-factory/commit/e3dcee6453e0ddc634c5eeaafcf67d14f5326c35))
* fix typo in code snippet ([974e5a1](https://github.com/lukso-network/tools-lsp-factory/commit/974e5a128191679112112b78cc3596baa7b3adbb))
* fix typo in LSP3 docs ([#87](https://github.com/lukso-network/tools-lsp-factory/issues/87)) ([bf2f43a](https://github.com/lukso-network/tools-lsp-factory/commit/bf2f43ab197e3b98244d528c49dfefe71eae393f))
* fix typo in LSP3 docs ([#87](https://github.com/lukso-network/tools-lsp-factory/issues/87)) ([381be2b](https://github.com/lukso-network/tools-lsp-factory/commit/381be2bbfd033983062620ee5a469ecbdc90655f))
* generate tech ref docs on release ([4e47e2f](https://github.com/lukso-network/tools-lsp-factory/commit/4e47e2f7b00fca6c3c220e41d6265bb51fe892fb))
* improve class methods docs ([0be34c5](https://github.com/lukso-network/tools-lsp-factory/commit/0be34c5f2bfb2650234be10277fc77ea90b16983))
* improve class spec docs ([eb42582](https://github.com/lukso-network/tools-lsp-factory/commit/eb42582a82be4d6dc2b312d4bc34de843dd00a12))
* improve deploy reactive events documentation ([8d06383](https://github.com/lukso-network/tools-lsp-factory/commit/8d06383b3db3a962ffdbea7dd51ac2ec1267115c))
* improve deployment option object docs ([02e90c5](https://github.com/lukso-network/tools-lsp-factory/commit/02e90c5479b30292de004ebc7f0a1315341934bd))
* improve docs ([b4bf74d](https://github.com/lukso-network/tools-lsp-factory/commit/b4bf74dbf190ee87b3f94815ea9e4403ffcb3481))
* improve docs ([#23](https://github.com/lukso-network/tools-lsp-factory/issues/23)) ([155688d](https://github.com/lukso-network/tools-lsp-factory/commit/155688d4fe5dee3094e8aa92a7b25d4d99756799))
* improve jsdocs ([ee452d7](https://github.com/lukso-network/tools-lsp-factory/commit/ee452d7572d806e4fa0abd499c829ba7458bdb72))
* improve lsp3 metadata upload docs ([3110846](https://github.com/lukso-network/tools-lsp-factory/commit/3110846fc8bd8e43469827d507804ac57d572ade))
* improve lsp3 metadata upload docs ([069b2fe](https://github.com/lukso-network/tools-lsp-factory/commit/069b2fe0291bf3ca5da85a5b436015a26dc1fa22))
* improve README ([517f5d7](https://github.com/lukso-network/tools-lsp-factory/commit/517f5d7a5d0454415561cd9e2679b24524526d1a))
* improve technical-reference docs generation ([7c05786](https://github.com/lukso-network/tools-lsp-factory/commit/7c0578675b3fbd7ebcb57a6e82caa7d78f9f6b89))
* improve typedoc options and re-generate ([4ac75f4](https://github.com/lukso-network/tools-lsp-factory/commit/4ac75f424577164474878ca7eb79a5589f73d1c7))
* improve universal profile docs ([c40b833](https://github.com/lukso-network/tools-lsp-factory/commit/c40b8333bd85885b305e8fd6a36227375a764444))
* improve universal profile docs ([0a2ff35](https://github.com/lukso-network/tools-lsp-factory/commit/0a2ff35d1a6516e7b4d22529d587225872b08be7))
* minor change to LSP3 upload docs ([9a52dd4](https://github.com/lukso-network/tools-lsp-factory/commit/9a52dd43124ed0154a824b25fc59d8679df97d73))
* minor change to LSP3 upload docs ([b6106c4](https://github.com/lukso-network/tools-lsp-factory/commit/b6106c4b28e542d490624632474d158f36cfb6d4))
* minor improvements ([4046940](https://github.com/lukso-network/tools-lsp-factory/commit/4046940899371e47507b7bf46f7d15777b963ba9))
* minor improvements ([b0653fd](https://github.com/lukso-network/tools-lsp-factory/commit/b0653fdd3309b464f93a1c7466da7aa2f06f73ae))
* minor improvements to docs ([edc7f43](https://github.com/lukso-network/tools-lsp-factory/commit/edc7f4350b3edc62e0ef5483f065e2519b7b8523))
* minor improvements to docs ([b48ba7a](https://github.com/lukso-network/tools-lsp-factory/commit/b48ba7a676694f63f5c6cbd8083fc9b43c34f7b9))
* minor improvements to docs ([#82](https://github.com/lukso-network/tools-lsp-factory/issues/82)) ([3747f8e](https://github.com/lukso-network/tools-lsp-factory/commit/3747f8ee0c7e28380a8ad9403d79024d2f695918))
* minor updates to rective deployment examples and changelog ([368fd9a](https://github.com/lukso-network/tools-lsp-factory/commit/368fd9a6742f9ceb719e303804d1c474ba176be8))
* remove old observale return type from docs ([#142](https://github.com/lukso-network/tools-lsp-factory/issues/142)) ([ee6df6f](https://github.com/lukso-network/tools-lsp-factory/commit/ee6df6feaeeb35d752109ef0bed18dafc75e9079))
* replace l16 with testnet for RPC links ([e44e46d](https://github.com/lukso-network/tools-lsp-factory/commit/e44e46d420a4826327938071674421912bef74a4))
* sync docs with docs website ([ee8d42d](https://github.com/lukso-network/tools-lsp-factory/commit/ee8d42d050439d1d0d36cd0d77bbbaccf2449b6c))
* sync LSP3UniversalProfile spec docs ([65ae6f0](https://github.com/lukso-network/tools-lsp-factory/commit/65ae6f068f25b9f724756e815918c186b1e19c59))
* sync with docs website ([93ba7ae](https://github.com/lukso-network/tools-lsp-factory/commit/93ba7ae821fef8d6d08bde36eb6398382d68997b))
* sync with docs website ([20e7dc7](https://github.com/lukso-network/tools-lsp-factory/commit/20e7dc74c1bee31ff3667c6b50054e20d73fbb23))
* sync with docs website ([#59](https://github.com/lukso-network/tools-lsp-factory/issues/59)) ([d2e34e7](https://github.com/lukso-network/tools-lsp-factory/commit/d2e34e7cea0b8468815160fd5189d70fe41f4c7f))
* sync with update to docs repo ([#49](https://github.com/lukso-network/tools-lsp-factory/issues/49)) ([57fd52e](https://github.com/lukso-network/tools-lsp-factory/commit/57fd52e0e953e822721fd838a9f0695b27988b4d))
* update chainId in docs to 4201 (testnet) ([1873e89](https://github.com/lukso-network/tools-lsp-factory/commit/1873e89781e9ab10d38aa97a38db22ce864af3ad))
* update deploy reactive documentation ([#81](https://github.com/lukso-network/tools-lsp-factory/issues/81)) ([dd313d0](https://github.com/lukso-network/tools-lsp-factory/commit/dd313d0e75b06f41bbafecd2809ec91a9a4d8718))
* update deploy reactive example in readme ([c39e228](https://github.com/lukso-network/tools-lsp-factory/commit/c39e2286520d047800e2bb2ee4a18cb7c9b471ed))
* update deploy reactive example in readme ([0043967](https://github.com/lukso-network/tools-lsp-factory/commit/00439672d2eecb28916ce255441305aabc9a1b15))
* update docs to use l16 RPC and chainId ([#139](https://github.com/lukso-network/tools-lsp-factory/issues/139)) ([53874b6](https://github.com/lukso-network/tools-lsp-factory/commit/53874b62c8b01f4b7116d341fbe25944b5aae317))
* update docs to use only version config param ([82a469b](https://github.com/lukso-network/tools-lsp-factory/commit/82a469b18237c300ce48ffe4ad5c3a08426fb938))
* update links ([5474fad](https://github.com/lukso-network/tools-lsp-factory/commit/5474fadffd051445ff49c796804e0434d263db17))
* update lsp7/8 controllerAddress param ([#85](https://github.com/lukso-network/tools-lsp-factory/issues/85)) ([ed1c80d](https://github.com/lukso-network/tools-lsp-factory/commit/ed1c80d7d68ad81343f8f0df8936ed738f7e1736))
* update lsp7/8 controllerAddress param ([#85](https://github.com/lukso-network/tools-lsp-factory/issues/85)) ([8d3818e](https://github.com/lukso-network/tools-lsp-factory/commit/8d3818e9c8d65c6d42c105384eb44e51bea840d3))
* update ownerAddress -&gt; controllerAddress for digital assets ([4a9a3da](https://github.com/lukso-network/tools-lsp-factory/commit/4a9a3da059342381d645acca43006084d10a51db))
* update uploadOptions object ([0e1d2d2](https://github.com/lukso-network/tools-lsp-factory/commit/0e1d2d241a8931cf31dcb82b281469e9d3b07627))


### Tests

* add basic tests for x1 and x2 controller address ([8ae0fc0](https://github.com/lukso-network/tools-lsp-factory/commit/8ae0fc0618300dc25afa4e10ea1318a41904506c))
* add comprehensive test suite for viem refactor ([3bfab26](https://github.com/lukso-network/tools-lsp-factory/commit/3bfab26c6be7f74ed461d94ab909ed14dd346182))
* add unit tests for setData ([c596bae](https://github.com/lukso-network/tools-lsp-factory/commit/c596bae743aa85c92ea2b5dc02ef4fbb07ee7570))
* combine key generation steps into one variable ([1c8c3dc](https://github.com/lukso-network/tools-lsp-factory/commit/1c8c3dccf72829f8008e756c21f2b8274d7b0fe8))
* default jest to use fake timers ([76c4d31](https://github.com/lukso-network/tools-lsp-factory/commit/76c4d319278836e61ee9f1b5ab99009825aea0c1))
* fix KM initialize calldata placeholder length expectation ([aaaff93](https://github.com/lukso-network/tools-lsp-factory/commit/aaaff935829da379c2d7995c25420215f288e632))
* fix providers and signers errors in tests ([9f279ae](https://github.com/lukso-network/tools-lsp-factory/commit/9f279ae203ca999de3de3de83fa707359119ad44))
* fix setData tests ([8ba099c](https://github.com/lukso-network/tools-lsp-factory/commit/8ba099c57874143706b8cdf29a6d112ce229a53a))
* image buffer resize and upload ([35301d8](https://github.com/lukso-network/tools-lsp-factory/commit/35301d8ca6ae3f1ea5b2353a9aaa8f623f7504b4))
* improve coverage to 100% stmts/funcs/lines, rewrite README for v4 ([1f18a9c](https://github.com/lukso-network/tools-lsp-factory/commit/1f18a9cc3b843ce29fa78e6d135f15a73e285e1a))
* move controller addresses tests in lsp3-universal-profile.spec.ts ([64650d3](https://github.com/lukso-network/tools-lsp-factory/commit/64650d37ab02721d4d1aaa5f586bb6e1c9ba77ea))
* simplify tests with `getData` ([eed59e7](https://github.com/lukso-network/tools-lsp-factory/commit/eed59e7b1aec3bd0d16e5832ee319e253a51743d))


### CI/CD

* Add missing 'should release' check in release CI ([494775a](https://github.com/lukso-network/tools-lsp-factory/commit/494775a29ff51fd7a6355e19e4e091b65ed16863))
* add release please workflow ([#206](https://github.com/lukso-network/tools-lsp-factory/issues/206)) ([22bd131](https://github.com/lukso-network/tools-lsp-factory/commit/22bd1316bb568b87d64cfb531f7a55e02e2da5da))
* add release-please config, npm publish with OIDC provenance ([5f1a5df](https://github.com/lukso-network/tools-lsp-factory/commit/5f1a5dfba06d87e6f3a63bfcc89563cee430a343))
* build package before running tests ([1252152](https://github.com/lukso-network/tools-lsp-factory/commit/125215208f09dd68bd772d7c7cd9a8a4832cbe42))
* fix release action ([a83645a](https://github.com/lukso-network/tools-lsp-factory/commit/a83645af10e6299aa3801c42f62d1be0af9ed3b5))
* fix release ci ([fc9e5c8](https://github.com/lukso-network/tools-lsp-factory/commit/fc9e5c81b942c4f4ba397c13ad94ffe8f545c2cd))
* remove auto generated docs from CI ([7338180](https://github.com/lukso-network/tools-lsp-factory/commit/73381802ef4acd2dff082aec3a55df495621d182))
* remove generate-types from test step (script no longer exists) ([1777e45](https://github.com/lukso-network/tools-lsp-factory/commit/1777e45a45ddb7b12e4f10d979ddd4a3a60c7128))
* remove permissions from release CI ([5f65a10](https://github.com/lukso-network/tools-lsp-factory/commit/5f65a100193e2c10cce54515a7b861264f7ea023))
* run local blockchain before running tests ([6ff18de](https://github.com/lukso-network/tools-lsp-factory/commit/6ff18de1b71a2d1f56788abf2a598a7a0bbf19fa))
* update release CI ([9905a24](https://github.com/lukso-network/tools-lsp-factory/commit/9905a246ca318fb01a4bf540a602a984a798c092))
* update release ci to use environment ([#254](https://github.com/lukso-network/tools-lsp-factory/issues/254)) ([740dd37](https://github.com/lukso-network/tools-lsp-factory/commit/740dd37ed818169e555bbf2651e006fe22af8ff4))
* upgrade GitHub Actions to latest versions ([911ab30](https://github.com/lukso-network/tools-lsp-factory/commit/911ab30f4b98d6f2805bb020da18e9e8870c9afc))


### Miscellaneous

* add deployProxy flag functionality to LSP8 deployment ([8402c16](https://github.com/lukso-network/tools-lsp-factory/commit/8402c16900897549fff521085ce966f9f6bcc93f))
* **constructor:** move chainId to SignerOptions object ([ac5c09b](https://github.com/lukso-network/tools-lsp-factory/commit/ac5c09bf6208c429c26d8f5c33d852667b92aa14))
* **controller permissions:** pass controller permissions in deploy function ([47fc329](https://github.com/lukso-network/tools-lsp-factory/commit/47fc329f9feed70c28beeab07fb6751e6a37afaf))
* flatten upload options object to just ipfsClientOptions ([09bd4f2](https://github.com/lukso-network/tools-lsp-factory/commit/09bd4f2c73fbef0e1ae62bb473d3f6812f5ea5fa))
* **lsp-factory:** Swap provider and signer constructors ([83b97d8](https://github.com/lukso-network/tools-lsp-factory/commit/83b97d8dc15c4bd24c6577928587598ae0ba6759))
* **lsp3:** rename UP controllerAccounts controllerAddresses ([a2c83b5](https://github.com/lukso-network/tools-lsp-factory/commit/a2c83b53f0b0ddbff3250c6f3cfb413e9b36e97a))
* release 3.1.0 ([6955282](https://github.com/lukso-network/tools-lsp-factory/commit/6955282cd707d10493dda0acd3d02d91dc607bcc))
* release 3.2.0 ([ba8398f](https://github.com/lukso-network/tools-lsp-factory/commit/ba8398f69ab24c8a75cb4d582cce51c9f9d8e5ed))
* release 3.3.0 ([3168e35](https://github.com/lukso-network/tools-lsp-factory/commit/3168e357c9d9023a3f0c931b4e421804e9a69b19))
* remove deployBaseContract method ([92f0501](https://github.com/lukso-network/tools-lsp-factory/commit/92f05010bae81ee12e4d1627f721837fdcb7c21f))
* remove jjmp and imge-size ([5bf8c03](https://github.com/lukso-network/tools-lsp-factory/commit/5bf8c03e073bb2bff590c8055b90c2dbd01b2a62))
* split LSP7/LSP8 DigitalAsset classes ([4049478](https://github.com/lukso-network/tools-lsp-factory/commit/404947811dd6e761eb3e0e51572395e1a975ba90))
* split LSP7/LSP8 DigitalAsset classes ([5c7e9c0](https://github.com/lukso-network/tools-lsp-factory/commit/5c7e9c01416ffeb7fb56055a47f896a037b4931b))
* update base contract addresses ([13e8de7](https://github.com/lukso-network/tools-lsp-factory/commit/13e8de7e9e09a7f72192c5f8f5210b2d6a792896))
* upgrade lsp-smart-contracts to 0.8.0 ([15f7eb7](https://github.com/lukso-network/tools-lsp-factory/commit/15f7eb7a0b26daf2e6bda49d8b524f29477d78f6))

## [3.1.1](https://github.com/lukso-network/tools-lsp-factory/compare/v3.1.0...v3.1.1) (2023-09-12)


### Bug Fixes

* use default SC version ([ed4a1a2](https://github.com/lukso-network/tools-lsp-factory/commit/ed4a1a2b85a0e1283ceb2142af64a1d74080d940))

## [3.1.0](https://github.com/lukso-network/tools-lsp-factory/compare/v3.0.0...v3.1.0) (2023-09-08)


### ⚠ BREAKING CHANGES

* upgrade lsp to v0.11.1

### Features

* upgrade lsp to v0.11.1 ([ccc61f8](https://github.com/lukso-network/tools-lsp-factory/commit/ccc61f855028c617767f726e317298ee65ee358a))


### Bug Fixes

* enable source map ([e3c60b3](https://github.com/lukso-network/tools-lsp-factory/commit/e3c60b331c213ce5ce6dec8479b577471345d76e))


### Miscellaneous Chores

* release 3.1.0 ([6955282](https://github.com/lukso-network/tools-lsp-factory/commit/6955282cd707d10493dda0acd3d02d91dc607bcc))

## [3.0.0](https://github.com/lukso-network/tools-lsp-factory/compare/v2.5.1...v3.0.0) (2023-08-17)

### ⚠ BREAKING CHANGES

- upgrade smart contracts to v0.10.3 ([#204](https://github.com/lukso-network/tools-lsp-factory/issues/204))

### Features

- upgrade smart contracts to v0.10.3 ([#204](https://github.com/lukso-network/tools-lsp-factory/issues/204)) ([db9d147](https://github.com/lukso-network/tools-lsp-factory/commit/db9d147df5b11dcb95c7a8249c683db49db2cce0))

### [2.5.1](https://github.com/lukso-network/tools-lsp-factory/compare/v2.5.0...v2.5.1) (2023-03-30)

### Bug Fixes

- Adjust versions of lsp-smart-contracts and erc725.js to match latest. ([c6b04a6](https://github.com/lukso-network/tools-lsp-factory/commit/c6b04a6f27d0aa59bf6d9a910054ec758546031c))
- get deployed contract addresses from event logs ([e674f69](https://github.com/lukso-network/tools-lsp-factory/commit/e674f693549d8eaa4b0ecbb39f9bf9424c291e50))
- give permission `REENTRANCY` to LSP1Delegate ([edb0c5e](https://github.com/lukso-network/tools-lsp-factory/commit/edb0c5e665ee22e95a79de6fe429423bd792f693))

## [2.5.0](https://github.com/lukso-network/tools-lsp-factory/compare/v2.4.0...v2.5.0) (2023-02-21)

### ⚠ BREAKING CHANGES

- update base contract addresses
- upgrade lsp-smart-contracts to 0.8.0

### Bug Fixes

- typo in `LinkMetadata` interface ([92c7fb9](https://github.com/lukso-network/tools-lsp-factory/commit/92c7fb9adbe201459528e261867a08480b37d639))

## [2.4.0](https://github.com/lukso-network/tools-lsp-factory/compare/v2.3.4...v2.4.0) (2022-09-15)

### ⚠ BREAKING CHANGES

- Upgrade lsp-smart-contracts to v0.7.0 (#163)

### Features

- Upgrade lsp-smart-contracts to v0.7.0 ([#163](https://github.com/lukso-network/tools-lsp-factory/issues/163)) ([761cd81](https://github.com/lukso-network/tools-lsp-factory/commit/761cd81089c55e4ab15d2a6c234ca39e40f3e46a))

### [2.3.4]([]https://github.com/lukso-network/tools-lsp-factory/compare/v2.3.3...v2.3.4) (2022-09-09)

### Features

- Give URD super setdata permission for UP ([3a291bf](https://github.com/lukso-network/tools-lsp-factory/commit/3a291bf06b29c3f2382f52b439d89b172b643a38))

### Fixes

- add missing type for instance uploadMetadata ([3a291bf](https://github.com/lukso-network/tools-lsp-factory/commit/75ef1a6c994eabf4fa34fd3a101f8557fb2057c4))
- swap height and width when uploading images ([a14e0fd](https://github.com/lukso-network/tools-lsp-factory/commit/a14e0fd9b9302f7495c583deaab37009d6bba5c1))

### [2.3.3](https://github.com/lukso-network/tools-lsp-factory/compare/v2.3.2...v2.3.3) (2022-07-25)

### improvement

- get chainId from provider ([d2db829](https://github.com/lukso-network/tools-lsp-factory/commit/d2db829a47ca429befc4cfd9505d45316cf16fd4))

### [2.3.2](https://github.com/lukso-network/tools-lsp-factory/compare/v2.3.1...v2.3.2) (2022-06-24)

### Fixes

- remove gas price from gas estimates ([784b530](https://github.com/lukso-network/tools-lsp-factory/commit/784b530))

### [2.3.1](https://github.com/lukso-network/tools-lsp-factory/compare/v2.3.0...v2.3.1) (2022-06-22)

### Features

- add base contract addresses on L16 ([89c1358](https://github.com/lukso-network/tools-lsp-factory/commit/89c13585224ae8e4767111e3806316ed133f44e1))

## [2.3.0](https://github.com/lukso-network/tools-lsp-factory/compare/v2.2.0...v2.3.0) (2022-05-30)

### ⚠ BREAKING CHANGES

- remove reactiveDeployment (#120)
- rename LSP3UniversalProfile -> UniversalProfile (#119)
- use full universal profile contract names (#118)
- Adds contract object to digital asset options object
- Update smart contracts to v0.6.0.

### Features

- add avatar to LSP3 upload ([#121](https://github.com/lukso-network/tools-lsp-factory/issues/121)) ([e278d5a](https://github.com/lukso-network/tools-lsp-factory/commit/e278d5a69bf667cbb5bced47976250a644384b78))

### improvement

- Adds contract object to digital asset options object ([bf01091](https://github.com/lukso-network/tools-lsp-factory/commit/bf01091b7110cf7ee6492aaf13f5bc51f90c3d43))
- remove reactiveDeployment ([#120](https://github.com/lukso-network/tools-lsp-factory/issues/120)) ([8ea2eb3](https://github.com/lukso-network/tools-lsp-factory/commit/8ea2eb36ead007c0282034f971868e0c90339d3b))
- rename LSP3UniversalProfile -> UniversalProfile ([#119](https://github.com/lukso-network/tools-lsp-factory/issues/119)) ([feac758](https://github.com/lukso-network/tools-lsp-factory/commit/feac7581f8f6197ec6e3cd742db29fd89d3f2d6a))
- use full universal profile contract names ([#118](https://github.com/lukso-network/tools-lsp-factory/issues/118)) ([12cef50](https://github.com/lukso-network/tools-lsp-factory/commit/12cef504bebc5c5e1fccdb1200205bfa04d95ee0))

## [2.2.0](https://github.com/lukso-network/tools-lsp-factory/compare/v2.1.0...v2.2.0) (2022-05-20)

### ⚠ BREAKING CHANGES

- flatten upload options object to just ipfsClientOptions
- use version key for UP contract config options
- use version key for digital asset contract config options

### Features

- allow passing lsp3 data straight to erc725.js for encoding ([a431360](https://github.com/lukso-network/tools-lsp-factory/commit/a4313602d16d8f6828c3db9e798c60a6cc0e1f4a))
- allow passing lsp4metadata to erc725 js for encoding ([02ed239](https://github.com/lukso-network/tools-lsp-factory/commit/02ed2399e03c4efe43152ec15f8a69ea4d3c26f9))
- improve reactive deployment events
- batch requests for setData and transferOwnership transactions

## [2.1.0](https://github.com/lukso-network/tools-lsp-factory/compare/v2.0.0...v2.1.0) (2022-04-11)

### ⚠ BREAKING CHANGES

- remove jjmp and imge-size

### Features

- allow passing window.ethereum object during instantiation ([649f9d7](https://github.com/lukso-network/tools-lsp-factory/commit/649f9d7ff32239b74383bbea4394389ccb5bff88))

- remove jjmp and imge-size ([5bf8c03](https://github.com/lukso-network/tools-lsp-factory/commit/5bf8c03e073bb2bff590c8055b90c2dbd01b2a62))

## [2.0.0](https://github.com/lukso-network/tools-lsp-factory/compare/v1.0.2-alpha.8...v2.0.0) (2022-03-09)

### ⚠ BREAKING CHANGES

- remove deployBaseContract method
- split LSP7/LSP8 DigitalAsset classes
- **lsp3:** rename UP controllerAccounts controllerAddresses
- Remove deployReactive methods

### Features

- upload and set lsp4 metadata from deploy functions ([6a1ab63](https://github.com/lukso-network/tools-lsp-factory/commit/6a1ab639b7069b4a647cf033396e9c9d88f3958d))
- add LSP4 metadata class and upload ([ab427a2](https://github.com/lukso-network/tools-lsp-factory/commit/ab427a2b81b0717858403f71a3da02675bc9abc9))
- add custom uploadOptions param ([4819199](https://github.com/lukso-network/tools-lsp-factory/commit/48191991ec14897d668d5bd05aee43f57936caf4))
- deploy universal profile contracts with custom bytecode ([435f714](https://github.com/lukso-network/tools-lsp-factory/commit/435f71467a4ff3ddb368aa26458bc507c8ec9b1d))
- deploy digital asset contracts with custom bytecode ([0e00bcc](https://github.com/lukso-network/tools-lsp-factory/commit/0e00bcc61772e331e57bc20ae37d5b2482986a55))
- deployProxy flag functionality to UP deployment ([89e4102](https://github.com/lukso-network/tools-lsp-factory/commit/89e4102bc11131a12c3935de38a4d29479216670))
- add multiple controller addresses on deployment ([fff32f2](https://github.com/lukso-network/tools-lsp-factory/commit/fff32f2545f6205f46cb4ea15ba5b5d89f4dc6d6))
- init base contracts on deploy ([#24](https://github.com/lukso-network/tools-lsp-factory/issues/24)) ([63821da](https://github.com/lukso-network/tools-lsp-factory/commit/63821da95684c68555075004754ffdde1a3da4b4))
- upload image to IPFS from buffer ([f17b911](https://github.com/lukso-network/tools-lsp-factory/commit/f17b911820e277cade73089968fb9566e00d832f))

### Bug Fixes

- add missing types files in build ([#25](https://github.com/lukso-network/tools-lsp-factory/issues/25)) ([01eb05d](https://github.com/lukso-network/tools-lsp-factory/commit/01eb05d724ea48729646cf165efa01812cc77016)), closes [/github.com/dethcrypto/TypeChain/issues/430#issuecomment-964314162](https://github.com/lukso-network//github.com/dethcrypto/TypeChain/issues/430/issues/issuecomment-964314162)
- add zero-left padding for `AddressPermissions[]` length ([#55](https://github.com/lukso-network/tools-lsp-factory/issues/55)) ([c6a65bd](https://github.com/lukso-network/tools-lsp-factory/commit/c6a65bd87bef92cb81b46071f5b657b6ecdc76cf))
- deploy mintable digital assets ([6b95f07](https://github.com/lukso-network/tools-lsp-factory/commit/6b95f0780290501ad5a4cc788c1e614352ead23a))
- linter error ([455e9a4](https://github.com/lukso-network/tools-lsp-factory/commit/455e9a43c491b8ae691681b1e0e3851fa9369481))
- npm publish add .json file ([#15](https://github.com/lukso-network/tools-lsp-factory/issues/15)) ([ab52949](https://github.com/lukso-network/tools-lsp-factory/commit/ab529499b231a9fcf6d44edde6c592192832646d))
- set UniversalReceiverDelegate key to setData ([#35](https://github.com/lukso-network/tools-lsp-factory/issues/35)) ([4a25e1c](https://github.com/lukso-network/tools-lsp-factory/commit/4a25e1c73ca85d99d289302ac91cda5d4e5100d0))
- setData tx ([#17](https://github.com/lukso-network/tools-lsp-factory/issues/17)) ([b5b7cd7](https://github.com/lukso-network/tools-lsp-factory/commit/b5b7cd79d11212bad61b1f8bcda63dec24ea4294))
- use new variable name ([c2fbb84](https://github.com/lukso-network/tools-lsp-factory/commit/c2fbb8416b9d543e3843cfad89cffc5fd36d3dd9))

- Add deployProxy flag functionality to LSP7 deployment ([b930747](https://github.com/lukso-network/tools-lsp-factory/commit/b930747be2e4de7dc79e8c3b044be971e9956a9e))
- add deployProxy flag functionality to LSP8 deployment ([8402c16](https://github.com/lukso-network/tools-lsp-factory/commit/8402c16900897549fff521085ce966f9f6bcc93f))
- **lsp3:** rename UP controllerAccounts controllerAddresses ([a2c83b5](https://github.com/lukso-network/tools-lsp-factory/commit/a2c83b53f0b0ddbff3250c6f3cfb413e9b36e97a))
- remove deployBaseContract method ([92f0501](https://github.com/lukso-network/tools-lsp-factory/commit/92f05010bae81ee12e4d1627f721837fdcb7c21f))
- split LSP7/LSP8 DigitalAsset classes ([4049478](https://github.com/lukso-network/tools-lsp-factory/commit/404947811dd6e761eb3e0e51572395e1a975ba90))
- split LSP7/LSP8 DigitalAsset classes ([5c7e9c0](https://github.com/lukso-network/tools-lsp-factory/commit/5c7e9c01416ffeb7fb56055a47f896a037b4931b))

### [1.1.5](https://github.com/lukso-network/tools-lsp-factory/compare/v1.0.2-alpha.8...v1.1.5) (2021-11-23)

### Features

- upload image to IPFS from buffer ([f17b911](https://github.com/lukso-network/tools-lsp-factory/commit/f17b911820e277cade73089968fb9566e00d832f))

### [1.1.4](https://github.com/lukso-network/tools-lsp-factory/compare/v1.0.2-alpha.8...v1.1.4) (2021-11-18)

### Bug Fixes

- set UniversalReceiverDelegate key to setData ([#35](https://github.com/lukso-network/tools-lsp-factory/issues/35)) ([4a25e1c](https://github.com/lukso-network/tools-lsp-factory/commit/4a25e1c73ca85d99d289302ac91cda5d4e5100d0))

### [1.1.3](https://github.com/lukso-network/tools-lsp-factory/compare/v1.0.2-alpha.8...v1.1.3) (2021-11-17)

### Features

- init base contracts on deploy ([#24](https://github.com/lukso-network/tools-lsp-factory/issues/24)) ([63821da](https://github.com/lukso-network/tools-lsp-factory/commit/63821da95684c68555075004754ffdde1a3da4b4))

### Bug Fixes

- add missing types files in build ([#25](https://github.com/lukso-network/tools-lsp-factory/issues/25)) ([01eb05d](https://github.com/lukso-network/tools-lsp-factory/commit/01eb05d724ea48729646cf165efa01812cc77016)), closes [/github.com/dethcrypto/TypeChain/issues/430#issuecomment-964314162](https://github.com/lukso-network//github.com/dethcrypto/TypeChain/issues/430/issues/issuecomment-964314162)
- npm publish add .json file ([#15](https://github.com/lukso-network/tools-lsp-factory/issues/15)) ([ab52949](https://github.com/lukso-network/tools-lsp-factory/commit/ab529499b231a9fcf6d44edde6c592192832646d))
- setData tx ([#17](https://github.com/lukso-network/tools-lsp-factory/issues/17)) ([b5b7cd7](https://github.com/lukso-network/tools-lsp-factory/commit/b5b7cd79d11212bad61b1f8bcda63dec24ea4294))

### [1.1.2](https://github.com/lukso-network/tools-lspFactory/compare/v1.0.2-alpha.8...v1.1.2) (2021-11-02)

### Bug Fixes

- npm publish add .json file ([#15](https://github.com/lukso-network/tools-lspFactory/issues/15)) ([ab52949](https://github.com/lukso-network/tools-lspFactory/commit/ab529499b231a9fcf6d44edde6c592192832646d))
- setData tx ([#17](https://github.com/lukso-network/tools-lspFactory/issues/17)) ([b5b7cd7](https://github.com/lukso-network/tools-lspFactory/commit/b5b7cd79d11212bad61b1f8bcda63dec24ea4294))

### 1.1.1 (2021-11-02)

### ⚠ BREAKING CHANGES

- **constructor:** move chainId to SignerOptions object
- **controller permissions:** pass controller permissions in deploy function
- **lsp-factory:** Swap provider and signer constructors
- **deploy:** Make deploy return promise and add deployReactive function

### Features

- **base contracts:** add deployBaseContracts method ([567c24a](https://github.com/lukso-network/tools-lspFactory/commit/567c24a502dbb22faa7a3bcb7e2dd27b34cae32f))
- **base contracts:** Deploy base contract if not yet deployed ([a737992](https://github.com/lukso-network/tools-lspFactory/commit/a737992cd4c773dc5e481390a01b5916bd97a7b3))
- **base contracts:** use newly deployed base contracts if default addresses are empty ([3f14f54](https://github.com/lukso-network/tools-lspFactory/commit/3f14f54764f5b108901cc551a521c918c8e168ea))
- **constructor:** allow private key and RPC url strings as LSPFactory construtors ([e783d35](https://github.com/lukso-network/tools-lspFactory/commit/e783d35cacb5f8ecd31623770003cec97ab23e5c))
- **deploy:** Make deploy return promise and add deployReactive function ([eb8df4f](https://github.com/lukso-network/tools-lspFactory/commit/eb8df4f7d835d1523f6755c20522780730f0c645))
- **deploymentEvent:** add base contract deploymenet events ([351cb4f](https://github.com/lukso-network/tools-lspFactory/commit/351cb4fc760ba240eceeb518c44e75140559f79f))
- **digital-asset:** add LSP7 and LSP8 deployment ([80666b2](https://github.com/lukso-network/tools-lspFactory/commit/80666b28eacf5caed6cd27a7242dfcea266a0027))
- **github-workflows:** add github workflow for npm test ([477a6cd](https://github.com/lukso-network/tools-lspFactory/commit/477a6cd1d79b653fccb9e8d9a2e0b5562131725e))
- **LSP3:** allow File object or LSP3 ready images to be passed ([e89b747](https://github.com/lukso-network/tools-lspFactory/commit/e89b747dd25e018d179d811ad1b81423d95bdb51))
- **LSP3:** allow nullable LSP3 data ([11cc53b](https://github.com/lukso-network/tools-lspFactory/commit/11cc53b7ff77c38293545c5a01c64f7d7850b9bb))
- **lsp3:** upload lsp3 data to ipfs while deploying ([0d9c0ba](https://github.com/lukso-network/tools-lspFactory/commit/0d9c0ba3b5410ed4b314460f00a3f656c2d66db7))
- **lsp7:** add proxy deployment of lsp7 ([b8726c5](https://github.com/lukso-network/tools-lspFactory/commit/b8726c51f16d691f61fbbafee5fd6ae5cf93b15b))
- **lsp8:** add proxy deployment for lsp8 ([2b6eae0](https://github.com/lukso-network/tools-lspFactory/commit/2b6eae0b3057ccb922bc78837a54be17fe521fea))
- **lspFactory:** Add SignerOptions object in constructor ([f6b5fd3](https://github.com/lukso-network/tools-lspFactory/commit/f6b5fd3638c893e168f5b2754e92f1e0f7b81806))
- **profile-deployments:** poc deployment events ([64d777a](https://github.com/lukso-network/tools-lspFactory/commit/64d777ab15d9708d2cc982d33ac9a7901cf52b5e))
- **profile-proxy-deployments:** initial alpha version ([e883d08](https://github.com/lukso-network/tools-lspFactory/commit/e883d08b6f0cc1ddbc1cbfeac8468fe52c849259))
- **profile-upload:** alpha version of image upload ([c72af0c](https://github.com/lukso-network/tools-lspFactory/commit/c72af0cfe20cbe2e17adc73373402692940fab1b))
- **signer permissions:** Set user defined signer permissions on KeyManager when deploying ([3f5e1f0](https://github.com/lukso-network/tools-lspFactory/commit/3f5e1f0c726aef73cfedfad3c04ef43337f77ff3))

### Bug Fixes

- **config-helper:** use the correct keys ([47ea967](https://github.com/lukso-network/tools-lspFactory/commit/47ea967ac94f53869dcdd8b64b5d5897bd42d521))
- correct npm version regression ([848ff69](https://github.com/lukso-network/tools-lspFactory/commit/848ff69cc6ddf50182497f4b538421b4ee7ac66e))
- **lsp3-upload:** remove File type check ([d5825d1](https://github.com/lukso-network/tools-lspFactory/commit/d5825d1d02c8e325580e6d48c882483fb283d7a1))
- npm publish add .json file ([#15](https://github.com/lukso-network/tools-lspFactory/issues/15)) ([ab52949](https://github.com/lukso-network/tools-lspFactory/commit/ab529499b231a9fcf6d44edde6c592192832646d))
- **package-lock:** fix broken package lock ([3facec6](https://github.com/lukso-network/tools-lspFactory/commit/3facec612adc66775d23d8e4794490b95db2fc09))
- **profile-deployment:** fix proxy initialization ([699417a](https://github.com/lukso-network/tools-lspFactory/commit/699417ae5e9c5cd6fca8d11561b0887fe7e82f70))
- proxy deployer test ([6cd79a8](https://github.com/lukso-network/tools-lspFactory/commit/6cd79a8cf95f78bd9f20cab0e544bdebf00bc41e))
- setData tx ([#17](https://github.com/lukso-network/tools-lspFactory/issues/17)) ([b5b7cd7](https://github.com/lukso-network/tools-lspFactory/commit/b5b7cd79d11212bad61b1f8bcda63dec24ea4294))

- **constructor:** move chainId to SignerOptions object ([ac5c09b](https://github.com/lukso-network/tools-lspFactory/commit/ac5c09bf6208c429c26d8f5c33d852667b92aa14))
- **controller permissions:** pass controller permissions in deploy function ([47fc329](https://github.com/lukso-network/tools-lspFactory/commit/47fc329f9feed70c28beeab07fb6751e6a37afaf))
- **lsp-factory:** Swap provider and signer constructors ([83b97d8](https://github.com/lukso-network/tools-lspFactory/commit/83b97d8dc15c4bd24c6577928587598ae0ba6759))
