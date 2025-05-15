import { ResourceComposer, BaseStack, createStack } from '@kubricate/core';
import { PersistentVolumeClaim } from 'kubernetes-models/v1';
import { createMetadata } from '@kubricate/toolkit';
import type { IFileShareStack } from './types.js';

export const FileShareStack = createStack('FileShareStack', (data: IFileShareStack) => {
  const generateMetadata = createMetadata(data.namespace ?? 'default');

  return new ResourceComposer().addClass({
    id: 'file-share-pvc',
    type: PersistentVolumeClaim,
    config: {
      metadata: generateMetadata(data.name, 'persistentVolumeClaim'),
      spec: {
        accessModes: ['ReadWriteMany'],
        resources: {
          requests: {
            storage: data.size,
          },
        },
        storageClassName: data.storageClassName,
      },
    },
  });
});
