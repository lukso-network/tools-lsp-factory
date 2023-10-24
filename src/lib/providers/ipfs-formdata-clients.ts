import {
  BaseFormDataUploader,
  FormDataPostHeaders,
  FormDataRequestOptions,
} from './formdata-base-client';

export class CustomHeaderFormDataUploader extends BaseFormDataUploader {
  constructor(private endpoint: string, private headers: FormDataPostHeaders) {
    super();
  }
  getRequestOptions(_dataContent: FormData, meta?: FormDataPostHeaders): FormDataRequestOptions {
    return { headers: { ...this.headers, ...meta } };
  }
  getPostEndpoint(): string {
    return this.endpoint;
  }
}
