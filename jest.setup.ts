import { waffleJest } from '@ethereum-waffle/jest';
import { config } from 'dotenv';

config({ path: '.env.test' });

jest.setTimeout(15000);
expect.extend(waffleJest);

jest.useFakeTimers();
