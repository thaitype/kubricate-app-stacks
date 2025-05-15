import { ResourceComposer, createStack } from '@kubricate/core';
import { joinPath, mergeMetadata, ResourceAllocator, createMetadata, resolveCors } from '@kubricate/toolkit';

import { Deployment } from 'kubernetes-models/apps/v1/Deployment';
import { Service } from 'kubernetes-models/v1/Service';
import { HTTPProxy, type IHTTPProxy } from '@kubernetes-models/contour/projectcontour.io/v1';
import { Certificate } from '@kubernetes-models/cert-manager/cert-manager.io/v1/Certificate';
import type { IContainer } from 'kubernetes-models/v1';

import type { IAppStack } from './types.js';
import { MountedVolumeProcessor } from './MountedVolumes.js';

function parseData(data: IAppStack) {
  if (!data.namespace && !data.identifier) {
    throw new Error('identifier must be provided when default namespace is used');
  }
  if (data.revisionsMode && ['multiple'].includes(data.revisionsMode)) {
    throw new Error('revisionsMode for multiple is not supported yet');
  }
  if (!data.ingress?.external?.certificate.issuerName) {
    throw new Error('External certificate issuerName must be provided');
  }
  if (data.ingress.internal?.protocol == 'https' && !data.ingress?.internal?.certificate?.secretName) {
    throw new Error('Internal Certificate secretName must be provided');
  }
  if (data.ingress.internal?.protocol == 'https' && !data.ingress?.internal?.certificate?.subjectName) {
    throw new Error('Internal Certificate subjectName must be provided');
  }
  if (!data.ingress?.internal?.protocol) {
    data.ingress.internal.protocol = 'http';
  }
  return {
    port: data.ingress?.targetPort ?? 80,
    namespace: data.namespace ?? 'default',
    replicas: data.replicas ?? 1,
    imageRegistry: data.imageRegistry ?? '',
    revisionsMode: data.revisionsMode ?? 'single',
    container: data.container,
    volumes: data.volumes,
    ingress: {
      external: {
        certificate: {
          issuerName: data.ingress?.external?.certificate.issuerName,
        },
      },
      internal: data.ingress?.internal,
    },
  };
}

export const AppStack = createStack('AppStack', (data: IAppStack) => {
  const config = parseData(data);
  const selectorAppName = data.identifier ? `${data.name}-${data.identifier}` : data.name;
  const generateMetadata = createMetadata(config.namespace);
  const labels = { app: selectorAppName };
  const certificate = {
    secretName: generateMetadata(data.name, 'certificate').name,
  };

  const mountedVolumes = new MountedVolumeProcessor(data.mountedVolumes).process();

  const corsPolicy = resolveCors(data.cors);
  const { cpu, memory, env, ...restContainerConfig } = config.container;
  const primaryContainer: IContainer = {
    ...restContainerConfig,
    image: joinPath(config.imageRegistry, config.container.image),
    name: config.container.name,
    ports: [{ containerPort: config.port }],
    resources: new ResourceAllocator(config.container.resourceAllocationPreset).computeResources({
      cpu: config.container.cpu,
      memory: config.container.memory,
    }),
    env,
    volumeMounts: [...(mountedVolumes.containerVolumeMounts ?? []), ...(config.container.volumeMounts ?? [])],
  };

  const primaryHttpProxyService: NonNullable<NonNullable<IHTTPProxy['spec']['routes']>[number]['services']>[number] = {
    name: `${data.name}-svc`,
    port: config.port,
    ...(config.ingress.internal.protocol === 'https'
      ? {
          validation: {
            caSecret: config.ingress.internal.certificate.secretName,
            subjectName: config.ingress.internal.certificate.subjectName,
          },
        }
      : {}),
  };

  const annotations = {
    internalHTTPS:
      config.ingress.internal.protocol === 'https'
        ? {
            'projectcontour.io/upstream-protocol.tls': String(config.port),
          }
        : ({} as Record<string, string>),
  };

  return new ResourceComposer()
    .addClass({
      id: 'deployment',
      type: Deployment,
      config: {
        metadata: generateMetadata(data.name, 'deployment'),
        spec: {
          replicas: config.replicas,
          selector: {
            matchLabels: labels,
          },
          template: {
            metadata: {
              labels,
            },
            spec: {
              containers: [primaryContainer],
              volumes: [...(mountedVolumes.volumes ?? []), ...(config.volumes ?? [])],
            },
          },
        },
      },
    })
    .addClass({
      id: 'service',
      type: Service,
      config: {
        metadata: {
          ...generateMetadata(data.name, 'service'),
          ...mergeMetadata('annotations', annotations.internalHTTPS),
        },
        spec: {
          selector: labels,
          type: 'ClusterIP',
          ports: [
            {
              name: config.ingress.internal.protocol,
              port: config.port,
              targetPort: config.port,
              protocol: 'TCP',
            },
          ],
        },
      },
    })
    .addClass({
      id: 'certificate',
      type: Certificate,
      config: {
        metadata: generateMetadata(data.name, 'certificate'),
        spec: {
          dnsNames: [data.domain],
          issuerRef: {
            kind: 'ClusterIssuer',
            name: `${config.ingress.external.certificate.issuerName}-cluster-issuer`,
          },
          // Certificate will be created and set in the Kube Secret
          secretName: certificate.secretName,
        },
      },
    })
    .addClass({
      id: 'httpProxy',
      type: HTTPProxy,
      config: {
        metadata: generateMetadata(data.name, 'httpProxy'),
        spec: {
          virtualhost: {
            fqdn: data.domain,
            corsPolicy,
            tls: {
              // Consume the certificate created above
              secretName: certificate.secretName,
            },
          },
          routes: [
            {
              conditions: [{ prefix: '/' }],
              services: [primaryHttpProxyService],
              ...data.ingress?.routeConfig,
            },
          ],
        },
      },
    });
});

