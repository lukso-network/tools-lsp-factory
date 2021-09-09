import { TestScheduler } from 'rxjs/testing';

import { defaultDeploymentEvents } from '../../../test/deployment-events.mock';
import { ContractNames, DeploymentStatus, DeploymentType } from '../interfaces';

import { waitForReceipt } from './deployment.helper';
const testScheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected);
});

describe('waitForReceipt', () => {
  describe('with type PROXY', () => {
    it('should return a new deployment event with the receipt', (done) => {
      const deploymentEvent = defaultDeploymentEvents.PROXY.LSP3Account.deployment;
      testScheduler.run((helpers) => {
        const { cold } = helpers;
        const deploymentEvents = {
          a: deploymentEvent,
        };
        const deploymentEvent$ = cold('a|', deploymentEvents);
        const receipt$ = waitForReceipt(deploymentEvent$);

        const { type, status, contractName } = deploymentEvent;
        receipt$.subscribe((deploymentEvent) => {
          expect(deploymentEvent).toEqual({
            type,
            status,
            contractName,
            receipt: 'fake receipt',
          });
          done();
        });
      });
    });

    it('should return a new deployment event with the receipt, functionName', (done) => {
      const deploymentEvent = defaultDeploymentEvents.PROXY.LSP3Account.initialize;
      testScheduler.run((helpers) => {
        const { cold } = helpers;
        const deploymentEvents = {
          a: deploymentEvent,
        };
        const deploymentEvent$ = cold('a|', deploymentEvents);
        const receipt$ = waitForReceipt(deploymentEvent$);

        const { type, contractName, functionName } = deploymentEvent;
        receipt$.subscribe((deploymentEvent) => {
          expect(deploymentEvent).toEqual({
            type,
            status: DeploymentStatus.COMPLETE,
            functionName,
            contractName,
            receipt: 'fake receipt',
          });
          done();
        });
      });
    });

    it('should throw an error incase transaction.wait() fails/errors', (done) => {
      const deploymentEvent = defaultDeploymentEvents.PROXY.LSP3Account.error;
      testScheduler.run((helpers) => {
        const { cold } = helpers;
        const deploymentEvents = {
          a: deploymentEvent,
        };
        const deploymentEvent$ = cold('a|', deploymentEvents);
        const receipt$ = waitForReceipt(deploymentEvent$);

        receipt$.subscribe({
          error: (deploymentEvent) => {
            expect(deploymentEvent.message).toContain(
              'Error when waiting for the transaction receipt: '
            );
            done();
          },
        });
      });
    });
  });
});
