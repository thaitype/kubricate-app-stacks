import { ResourceComposer, createStack } from '@kubricate/core';
import { createMetadata, joinPath } from '@kubricate/toolkit';
import { PersistentVolumeClaim, Service } from 'kubernetes-models/v1';
import { Deployment } from 'kubernetes-models/apps/v1';
import type { IContainer } from 'kubernetes-models/v1';

import type { IPrivateAppStack } from './types.js';
import { MountedVolumeProcessor } from './MountedVolumes.js';

export const PrivateAppStack = createStack('PrivateAppStack', (data: IPrivateAppStack) => {
  const generateMetadata = createMetadata(data.namespace ?? 'default');
  const selectorAppName = data.identifier ? `${data.name}-${data.identifier}` : data.name;
  const labels = { app: selectorAppName };
  const mountedVolumes = new MountedVolumeProcessor(data.mountedVolumes).process();

  const { resources, env, volumeMounts, ...restContainerConfig } = data.container;
  const primaryContainer: IContainer = {
    ...restContainerConfig,
    image: joinPath(data.imageRegistry, data.container.image || ''),
    resources,
    env,
    volumeMounts: [...(mountedVolumes.containerVolumeMounts ?? []), ...(volumeMounts ?? [])],
  };

  let resourceComposer: ResourceComposer = new ResourceComposer();

  mountedVolumes.volumes.forEach((volume, index) => {
    resourceComposer = resourceComposer.addClass({
      id: `pvc-${index}`,
      type: PersistentVolumeClaim,
      config: {
        metadata: generateMetadata(`${volume.name}`, 'persistentVolumeClaim'),
        spec: {
          accessModes: ['ReadWriteMany'],
          resources: {
            requests: {
              storage: data.storageSize || '10Mi',
            },
          },
          storageClassName: 'azurefile',
        },
      },
    });
  });

  return resourceComposer
    .addClass({
      id: 'deployment',
      type: Deployment,
      config: {
        metadata: generateMetadata(data.name, 'deployment'),
        spec: {
          replicas: data.replicas,
          selector: {
            matchLabels: labels,
          },
          template: {
            metadata: {
              labels,
            },
            spec: {
              containers: [primaryContainer],
              volumes: [...(mountedVolumes.volumes ?? []), ...(data.volumes ?? [])],
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
        },
        spec: {
          selector: labels,
          type: 'ClusterIP',
          ports: [
            {
              name: `${data.name}-tcp`,
              port: data.port,
              targetPort: data.port,
              protocol: 'TCP',
            },
          ],
        },
      },
    });
});

// export class AppStack extends BaseStack<typeof configureComposer> {
//   constructor() {
//     super();
//   }

//   from(data: IAppStack) {
//     const composer = configureComposer(data);
//     this.setComposer(composer);
//     return this;
//   }
// }
