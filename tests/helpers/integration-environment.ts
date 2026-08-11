import "vitest";

export type IntegrationEnvironment = {
  appHost: string;
  clientOrigin: string;
  minioBucket: string;
  minioPort: string;
  minioRootPassword: string;
  minioRootUser: string;
  minioRegion: string;
  postgresDatabase: string;
  postgresPassword: string;
  postgresPort: string;
  postgresUser: string;
};

declare module "vitest" {
  interface ProvidedContext {
    integrationEnvironment: IntegrationEnvironment;
  }
}
