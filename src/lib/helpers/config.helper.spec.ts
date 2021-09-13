import { LSP3_UP_KEYS } from './config.helper';

describe('Config Helpper', () => {
  it('should use the correct keys', () => {
    expect(LSP3_UP_KEYS.LSP3_PROFILE).toEqual(
      '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5'
    );
    expect(LSP3_UP_KEYS.UNIVERSAL_RECEIVER_DELEGATE_KEY).toEqual(
      '0x0cfc51aec37c55a4d0b1a65c6255c4bf2fbdf6277f3cc0730c45b828b6db8b47'
    );
  });
});
