import { of } from 'rxjs';

import { defaultDeploymentEvents } from '../../../test/deployment-events.mock';
import { DeploymentStatus } from '../interfaces';

import { waitForReceipt } from './deployment.helper';

describe('waitForReceipt', () => {
  beforeEach(() => {
    jest.useRealTimers();
  });
  describe('with type PROXY', () => {
    it('should return a new deployment event with the receipt', (done) => {
      const expectedDeploymentEvent = defaultDeploymentEvents.PROXY.ERC725Account.deployment;
      const deploymentEvent$ = of(expectedDeploymentEvent);
      const receipt$ = waitForReceipt(deploymentEvent$);

      const { type, status, contractName } = expectedDeploymentEvent;
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

    it('should return a new deployment event with the receipt, functionName', (done) => {
      const expectedDeploymentEvent = defaultDeploymentEvents.PROXY.ERC725Account.initialize;
      const expectedDeploymentEvent$ = of(expectedDeploymentEvent);
      const receipt$ = waitForReceipt(expectedDeploymentEvent$);

      const { type, contractName, functionName } = expectedDeploymentEvent;
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

    it('should throw an error incase transaction.wait() fails/errors', (done) => {
      const expectedDeploymentEvent$ = of(defaultDeploymentEvents.PROXY.ERC725Account.error);
      const receipt$ = waitForReceipt(expectedDeploymentEvent$);

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

// describe('initialize', () => {
//   it('should initialize the deployed proxy contract', (done) => {
//     const deploymentEvent = defaultDeploymentEvents.PROXY.LSP3Account.deploymentReceipt;
//     testScheduler.run((helpers) => {
//       const { cold } = helpers;
//       const deploymentEvents = {
//         a: deploymentEvent as unknown as DeploymentEvent,
//       };
//       const deploymentEvent$: Observable<DeploymentEvent> = cold('a|', deploymentEvents);

//       const factory = new LSP3AccountInit__factory();
//       jest.spyOn(factory, 'attach').mockImplementation(() => {
//         return {} as LSP3AccountInit;
//       });
//       const initialize$ = initialize(deploymentEvent$, factory, () => [false]);

//       initialize$.subscribe({
//         next: (deploymentEvent) => {
//           expect(factory.attach).toHaveBeenCalled();
//           expect(deploymentEvent).toEqual(2);
//           done();
//         },
//       });
//     });
//   });
// });
