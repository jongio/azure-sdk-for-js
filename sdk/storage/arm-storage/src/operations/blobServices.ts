/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for
 * license information.
 *
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is
 * regenerated.
 */

import * as msRest from "@azure/ms-rest-js";
import * as Models from "../models";
import * as Mappers from "../models/blobServicesMappers";
import * as Parameters from "../models/parameters";
import { StorageManagementClientContext } from "../storageManagementClientContext";

/** Class representing a BlobServices. */
export class BlobServices {
  private readonly client: StorageManagementClientContext;

  /**
   * Create a BlobServices.
   * @param {StorageManagementClientContext} client Reference to the service client.
   */
  constructor(client: StorageManagementClientContext) {
    this.client = client;
  }

  /**
   * Sets the properties of a storage account’s Blob service, including properties for Storage
   * Analytics and CORS (Cross-Origin Resource Sharing) rules.
   * @param resourceGroupName The name of the resource group within the user's subscription. The name
   * is case insensitive.
   * @param accountName The name of the storage account within the specified resource group. Storage
   * account names must be between 3 and 24 characters in length and use numbers and lower-case
   * letters only.
   * @param parameters The properties of a storage account’s Blob service, including properties for
   * Storage Analytics and CORS (Cross-Origin Resource Sharing) rules.
   * @param [options] The optional parameters
   * @returns Promise<Models.BlobServicesSetServicePropertiesResponse>
   */
  setServiceProperties(resourceGroupName: string, accountName: string, parameters: Models.BlobServiceProperties, options?: msRest.RequestOptionsBase): Promise<Models.BlobServicesSetServicePropertiesResponse>;
  /**
   * @param resourceGroupName The name of the resource group within the user's subscription. The name
   * is case insensitive.
   * @param accountName The name of the storage account within the specified resource group. Storage
   * account names must be between 3 and 24 characters in length and use numbers and lower-case
   * letters only.
   * @param parameters The properties of a storage account’s Blob service, including properties for
   * Storage Analytics and CORS (Cross-Origin Resource Sharing) rules.
   * @param callback The callback
   */
  setServiceProperties(resourceGroupName: string, accountName: string, parameters: Models.BlobServiceProperties, callback: msRest.ServiceCallback<Models.BlobServiceProperties>): void;
  /**
   * @param resourceGroupName The name of the resource group within the user's subscription. The name
   * is case insensitive.
   * @param accountName The name of the storage account within the specified resource group. Storage
   * account names must be between 3 and 24 characters in length and use numbers and lower-case
   * letters only.
   * @param parameters The properties of a storage account’s Blob service, including properties for
   * Storage Analytics and CORS (Cross-Origin Resource Sharing) rules.
   * @param options The optional parameters
   * @param callback The callback
   */
  setServiceProperties(resourceGroupName: string, accountName: string, parameters: Models.BlobServiceProperties, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.BlobServiceProperties>): void;
  setServiceProperties(resourceGroupName: string, accountName: string, parameters: Models.BlobServiceProperties, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.BlobServiceProperties>, callback?: msRest.ServiceCallback<Models.BlobServiceProperties>): Promise<Models.BlobServicesSetServicePropertiesResponse> {
    return this.client.sendOperationRequest(
      {
        resourceGroupName,
        accountName,
        parameters,
        options
      },
      setServicePropertiesOperationSpec,
      callback) as Promise<Models.BlobServicesSetServicePropertiesResponse>;
  }

  /**
   * Gets the properties of a storage account’s Blob service, including properties for Storage
   * Analytics and CORS (Cross-Origin Resource Sharing) rules.
   * @param resourceGroupName The name of the resource group within the user's subscription. The name
   * is case insensitive.
   * @param accountName The name of the storage account within the specified resource group. Storage
   * account names must be between 3 and 24 characters in length and use numbers and lower-case
   * letters only.
   * @param [options] The optional parameters
   * @returns Promise<Models.BlobServicesGetServicePropertiesResponse>
   */
  getServiceProperties(resourceGroupName: string, accountName: string, options?: msRest.RequestOptionsBase): Promise<Models.BlobServicesGetServicePropertiesResponse>;
  /**
   * @param resourceGroupName The name of the resource group within the user's subscription. The name
   * is case insensitive.
   * @param accountName The name of the storage account within the specified resource group. Storage
   * account names must be between 3 and 24 characters in length and use numbers and lower-case
   * letters only.
   * @param callback The callback
   */
  getServiceProperties(resourceGroupName: string, accountName: string, callback: msRest.ServiceCallback<Models.BlobServiceProperties>): void;
  /**
   * @param resourceGroupName The name of the resource group within the user's subscription. The name
   * is case insensitive.
   * @param accountName The name of the storage account within the specified resource group. Storage
   * account names must be between 3 and 24 characters in length and use numbers and lower-case
   * letters only.
   * @param options The optional parameters
   * @param callback The callback
   */
  getServiceProperties(resourceGroupName: string, accountName: string, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.BlobServiceProperties>): void;
  getServiceProperties(resourceGroupName: string, accountName: string, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.BlobServiceProperties>, callback?: msRest.ServiceCallback<Models.BlobServiceProperties>): Promise<Models.BlobServicesGetServicePropertiesResponse> {
    return this.client.sendOperationRequest(
      {
        resourceGroupName,
        accountName,
        options
      },
      getServicePropertiesOperationSpec,
      callback) as Promise<Models.BlobServicesGetServicePropertiesResponse>;
  }
}

// Operation Specifications
const serializer = new msRest.Serializer(Mappers);
const setServicePropertiesOperationSpec: msRest.OperationSpec = {
  httpMethod: "PUT",
  path: "subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Storage/storageAccounts/{accountName}/blobServices/{BlobServicesName}",
  urlParameters: [
    Parameters.resourceGroupName,
    Parameters.accountName,
    Parameters.subscriptionId,
    Parameters.blobServicesName
  ],
  queryParameters: [
    Parameters.apiVersion
  ],
  headerParameters: [
    Parameters.acceptLanguage
  ],
  requestBody: {
    parameterPath: "parameters",
    mapper: {
      ...Mappers.BlobServiceProperties,
      required: true
    }
  },
  responses: {
    200: {
      bodyMapper: Mappers.BlobServiceProperties
    },
    default: {
      bodyMapper: Mappers.CloudError
    }
  },
  serializer
};

const getServicePropertiesOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  path: "subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Storage/storageAccounts/{accountName}/blobServices/{BlobServicesName}",
  urlParameters: [
    Parameters.resourceGroupName,
    Parameters.accountName,
    Parameters.subscriptionId,
    Parameters.blobServicesName
  ],
  queryParameters: [
    Parameters.apiVersion
  ],
  headerParameters: [
    Parameters.acceptLanguage
  ],
  responses: {
    200: {
      bodyMapper: Mappers.BlobServiceProperties
    },
    default: {
      bodyMapper: Mappers.CloudError
    }
  },
  serializer
};