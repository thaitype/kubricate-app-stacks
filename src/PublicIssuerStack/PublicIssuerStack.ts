import { ResourceComposer, BaseStack, createStack } from '@kubricate/core';
import { createMetadata } from '@kubricate/toolkit';
import { ClusterIssuer } from '@kubernetes-models/cert-manager/cert-manager.io/v1';
import type { IPublicIssuerStack } from './types.js';

export const PublicIssuerStack = createStack('PublicIssuerStack', (data: IPublicIssuerStack) => {
  const generateMetadata = createMetadata(data.namespace ?? 'default');
  return new ResourceComposer().addClass({
    id: 'public-issuer',
    type: ClusterIssuer,
    config: {
      metadata: generateMetadata(data.name, 'clusterIssuer'),
      spec: {
        acme: {
          email: data.email,
          server: 'https://acme-v02.api.letsencrypt.org/directory',
          privateKeySecretRef: {
            name: `${data.name}-private-key`,
          },
          solvers: [
            {
              http01: {
                ingress: {
                  class: data.ingressClass,
                },
              },
            },
          ],
        },
      },
    },
  });
});
