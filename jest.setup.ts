import { waffleJest } from '@ethereum-waffle/jest';

jest.setTimeout(15000);
expect.extend(waffleJest);
