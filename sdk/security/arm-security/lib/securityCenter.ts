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
import * as Models from "./models";
import * as Mappers from "./models/mappers";
import * as operations from "./operations";
import { SecurityCenterContext } from "./securityCenterContext";


class SecurityCenter extends SecurityCenterContext {
  // Operation groups
  pricings: operations.Pricings;
  alerts: operations.Alerts;
  settings: operations.Settings;
  allowedConnections: operations.AllowedConnections;
  discoveredSecuritySolutions: operations.DiscoveredSecuritySolutions;
  externalSecuritySolutions: operations.ExternalSecuritySolutions;
  jitNetworkAccessPolicies: operations.JitNetworkAccessPolicies;
  locations: operations.Locations;
  operations: operations.Operations;
  tasks: operations.Tasks;
  topology: operations.Topology;
  advancedThreatProtection: operations.AdvancedThreatProtection;
  autoProvisioningSettings: operations.AutoProvisioningSettings;
  compliances: operations.Compliances;
  informationProtectionPolicies: operations.InformationProtectionPolicies;
  securityContacts: operations.SecurityContacts;
  workspaceSettings: operations.WorkspaceSettings;
  regulatoryComplianceStandards: operations.RegulatoryComplianceStandards;
  regulatoryComplianceControls: operations.RegulatoryComplianceControls;
  regulatoryComplianceAssessments: operations.RegulatoryComplianceAssessments;

  /**
   * Initializes a new instance of the SecurityCenter class.
   * @param credentials Credentials needed for the client to connect to Azure.
   * @param subscriptionId Azure subscription ID
   * @param ascLocation The location where ASC stores the data of the subscription. can be retrieved
   * from Get locations
   * @param [options] The parameter options
   */
  constructor(credentials: msRest.ServiceClientCredentials, subscriptionId: string, ascLocation: string, options?: Models.SecurityCenterOptions) {
    super(credentials, subscriptionId, ascLocation, options);
    this.pricings = new operations.Pricings(this);
    this.alerts = new operations.Alerts(this);
    this.settings = new operations.Settings(this);
    this.allowedConnections = new operations.AllowedConnections(this);
    this.discoveredSecuritySolutions = new operations.DiscoveredSecuritySolutions(this);
    this.externalSecuritySolutions = new operations.ExternalSecuritySolutions(this);
    this.jitNetworkAccessPolicies = new operations.JitNetworkAccessPolicies(this);
    this.locations = new operations.Locations(this);
    this.operations = new operations.Operations(this);
    this.tasks = new operations.Tasks(this);
    this.topology = new operations.Topology(this);
    this.advancedThreatProtection = new operations.AdvancedThreatProtection(this);
    this.autoProvisioningSettings = new operations.AutoProvisioningSettings(this);
    this.compliances = new operations.Compliances(this);
    this.informationProtectionPolicies = new operations.InformationProtectionPolicies(this);
    this.securityContacts = new operations.SecurityContacts(this);
    this.workspaceSettings = new operations.WorkspaceSettings(this);
    this.regulatoryComplianceStandards = new operations.RegulatoryComplianceStandards(this);
    this.regulatoryComplianceControls = new operations.RegulatoryComplianceControls(this);
    this.regulatoryComplianceAssessments = new operations.RegulatoryComplianceAssessments(this);
  }
}

// Operation Specifications

export {
  SecurityCenter,
  SecurityCenterContext,
  Models as SecurityCenterModels,
  Mappers as SecurityCenterMappers
};
export * from "./operations";