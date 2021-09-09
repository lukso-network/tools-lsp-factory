import { waffleJest } from '@ethereum-waffle/jest';

jest.setTimeout(2000);
expect.extend(waffleJest);
