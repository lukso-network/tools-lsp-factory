import { PinataConfig, PinataPinResponse } from '@pinata/sdk';
import FormData from 'form-data';
import isIPFS from 'is-ipfs';
import fetch from 'isomorphic-fetch';

export const ERROR_NO_CREDENTIALS_PROVIDED =
  'No credentials provided! Please provide your pinata api key and pinata secret api key or your pinata JWT key as an argument when you start this script';

export function validateHostNodes(hostNodes: any) {
  if (!Array.isArray(hostNodes)) {
    throw new Error('host_nodes value must be an array');
  }
  hostNodes.forEach((node) => {
    if (!isIPFS.peerMultiaddr(node)) {
      throw new Error(`host_node array entry: ${node} is not a valid peer multiaddr`);
    }
  });
}

export const handleError = (error: any) => {
  if (
    error &&
    error.response &&
    error.response &&
    error.response.data &&
    error.response.data.error
  ) {
    return error.response.data.error;
  } else if (error.data && error.data.error) {
    return error.data.error;
  } else if (error.response && error.response.error) {
    return error.response.error;
  }
  return error;
};

export function validateMetadata(metadata: any) {
  if (metadata.name) {
    if (!(typeof metadata.name === 'string' || metadata.name instanceof String)) {
      throw new Error('metadata name must be of type string');
    }
  }

  if (metadata.keyvalues) {
    if (!(typeof metadata.keyvalues === 'object')) {
      throw new Error('metatadata keyvalues must be an object');
    }

    let i = 0;

    Object.entries(metadata.keyvalues).forEach(function (keyValue: any) {
      if (i > 9) {
        throw new Error('No more than 10 keyvalues can be provided for metadata entries');
      }
      //  we want to make sure that the input is a string, a boolean, or a number, so we don't get an object passed in by accident
      if (
        !(
          typeof keyValue[1] === 'string' ||
          typeof keyValue[1] === 'boolean' ||
          !isNaN(keyValue[1])
        )
      ) {
        throw new Error('Metadata keyvalue values must be strings, booleans, or numbers');
      }
      i++;
    });
  }
}

export function validatePinPolicyStructure(pinPolicy: { regions: any[] }) {
  //this function takes in a pin policy and checks the JSON structure to make sure it's valid
  if (!pinPolicy) {
    throw new Error('No pin policy provided');
  }

  if (!pinPolicy.regions) {
    throw new Error('No regions provided in pin policy');
  }
  if (pinPolicy.regions.length) {
    pinPolicy.regions.forEach((region) => {
      if (!region.id || !(Object.prototype.toString.call(region.id) === '[object String]')) {
        throw new Error('region id must be a string');
      }

      if (
        !(region.desiredReplicationCount || region.desiredReplicationCount === 0) ||
        !Number.isInteger(region.desiredReplicationCount)
      ) {
        throw new Error('desiredReplicationCount must be an integer');
      }
    });
  }
}

export function validatePinataOptions(options: {
  cidVersion?: number;
  wrapWithDirectory?: boolean;
  hostNodes?: any;
  customPinPolicy?: any;
}) {
  if (typeof options !== 'object') {
    throw new Error('options must be an object');
  }

  if (options.cidVersion) {
    if (options.cidVersion != 0 && options.cidVersion != 1) {
      throw new Error('unsupported or invalid cidVersion');
    }
  }
  if (options.wrapWithDirectory) {
    if (options.wrapWithDirectory !== true && options.wrapWithDirectory !== false) {
      throw new Error('wrapWithDirectory must be a boolean value of true or false');
    }
  }

  if (options.hostNodes) {
    validateHostNodes(options.hostNodes);
  }

  if (options.customPinPolicy) {
    validatePinPolicyStructure(options.customPinPolicy);
  }
}

export interface axiosHeaders {
  maxContentLength: number;
  maxBodyLength: number;
  headers: {
    [key: string]: any;
  };
  withCredentials?: boolean;
}

export function createConfigForAxiosHeaders(config: PinataConfig) {
  if (
    config.pinataApiKey &&
    config.pinataApiKey.length > 0 &&
    config.pinataSecretApiKey &&
    config.pinataSecretApiKey.length > 0
  ) {
    return {
      withCredentials: true,
      headers: {
        pinata_api_key: config.pinataApiKey,
        pinata_secret_api_key: config.pinataSecretApiKey,
      },
    };
  }

  if (config.pinataJWTKey && config.pinataJWTKey.length > 0) {
    return {
      headers: {
        Authorization: `Bearer ${config.pinataJWTKey}`,
      },
    };
  }

  throw new Error(ERROR_NO_CREDENTIALS_PROVIDED);
}

export function createConfigForAxiosHeadersWithFormData(config: PinataConfig) {
  const requestOptions: axiosHeaders = {
    ...createConfigForAxiosHeaders(config),
    maxContentLength: Infinity, //this is needed to prevent axios from erroring out with large files
    maxBodyLength: Infinity,
  };
  return requestOptions;
}

const endpoint = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

export function uploadToIPFS(pinataConfig: PinataConfig, dataContent: FormData): Promise<URL> {
  const input = {
    method: 'POST',
    ...createConfigForAxiosHeadersWithFormData(pinataConfig),
  } as RequestInit;
  input.headers = { ...input.headers /* ...headers */ };
  return (global.fetch || fetch)(endpoint, {
    ...input,
    body: dataContent,
  })
    .then((response) => {
      if (response.status !== 200) {
        return response.text().then((text) => {
          let error = text;
          try {
            error = JSON.parse(text);
          } catch {
            // Ignore
          }
          error = (error as any).error || error;
          throw new Error(
            `unknown server response while pinning File to IPFS: ${error || response.status}`
          );
        });
      }
      return response.json() as Promise<PinataPinResponse>;
    })
    .catch(function (error) {
      return Promise.reject(handleError(error));
    })
    .then(({ IpfsHash }) => new URL(`ipfs://${IpfsHash}`));
}
