#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ToolkitSiteStack } from "../lib/toolkit-site-stack";

const app = new cdk.App();

new ToolkitSiteStack(app, "TlaToolkitSiteProduction", {
  env: {
    account: "339712712886",
    region: "us-east-1",
  },
  hostedZoneId: "Z071436424G7UTPG43XPK",
  siteContentPath: app.node.tryGetContext("siteContentPath"),
  description: "Production static site for toolkit.thelenders.app",
});
