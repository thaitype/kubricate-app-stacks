import { ResourceComposer, BaseStack, createStack } from '@kubricate/core';
import { createMetadata } from '@kubricate/toolkit';
import { Pod } from 'kubernetes-models/v1';
import type { INgrokStack } from './types.js';

export const NgrokStack = createStack('NgrokStack', (data: INgrokStack) => {
  const generateMetadata = createMetadata(data.namespace ?? 'default');
  return new ResourceComposer().addClass({
    id: 'pod',
    type: Pod,
    config: {
      metadata: generateMetadata(data.name, 'pod'),
      spec: {
        containers: [
          {
            name: data.name,
            image: 'ngrok/ngrok:latest',
            args: ['tcp', `${data.url}:${data.port}`],
          },
        ],
      },
    },
  });
});
