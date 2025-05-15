import { ResourceComposer, BaseStack, createStack } from '@kubricate/core';
import { PersistentVolumeClaim } from 'kubernetes-models/v1';
import { createMetadata } from '@kubricate/toolkit';
import { Job, type IJobSpec, CronJob } from 'kubernetes-models/batch/v1';
import { ClusterIssuer, Certificate } from '@kubernetes-models/cert-manager/cert-manager.io/v1';
import type { IPrivateCertStack } from './types.js';

export const PrivateCertStack = createStack('PrivateCertStack', (data: IPrivateCertStack) => {
  const generateMetadata = createMetadata(data.namespace ?? 'default');
  const jobTemplate: IJobSpec = {
    template: {
      spec: {
        containers: [
          {
            name: 'key2pfx',
            image: 'ghcr.io/thaitype/key2pfx:latest',
            env: [
              { name: 'KEY', value: '/certs/tls.key' },
              { name: 'CRT', value: '/certs/tls.crt' },
              { name: 'OUT', value: `/https/${data.pfxCertName}.pfx` },
            ],
            volumeMounts: [
              {
                mountPath: '/https/',
                name: 'key2pfx-v',
              },
              {
                mountPath: '/certs',
                name: 'private-cert',
              },
            ],
          },
        ],
        restartPolicy: 'Never',
        volumes: [
          {
            name: 'key2pfx-v',
            persistentVolumeClaim: {
              claimName: `${data.pfxCertName}-pvc`,
            },
          },
          {
            name: 'private-cert',
            secret: {
              secretName: data.secretCertName,
            },
          },
        ],
      },
    },
    backoffLimit: data.backoffLimit,
  };

  return new ResourceComposer()
    .addClass({
      id: 'cluster-issuer',
      type: ClusterIssuer,
      config: {
        metadata: generateMetadata(data.name, 'clusterIssuer'),
        spec: {
          selfSigned: {},
        },
      },
    })
    .addClass({
      id: 'certificate',
      type: Certificate,
      config: {
        metadata: generateMetadata(data.name, 'certificate'),
        spec: {
          secretName: data.secretCertName,
          issuerRef: {
            name: `${data.name}-cluster-issuer`,
            kind: 'ClusterIssuer',
          },
          commonName: data.commonName,
          dnsNames: data.dnsNames,
          duration: data.duration,
        },
      },
    })
    .addClass({
      id: 'pvc',
      type: PersistentVolumeClaim,
      config: {
        metadata: generateMetadata(`${data.pfxCertName}`, 'persistentVolumeClaim'),
        spec: {
          accessModes: ['ReadWriteMany'],
          resources: {
            requests: {
              storage: '10Mi',
            },
          },
          storageClassName: 'azurefile',
        },
      },
    })
    .addClass({
      id: 'job',
      type: Job,
      config: {
        metadata: generateMetadata(`${data.pfxCertName}`, 'job'),
        spec: jobTemplate,
      },
    })
    .addClass({
      id: 'cronJob',
      type: CronJob,
      config: {
        metadata: generateMetadata(`${data.pfxCertName}`, 'cronJob'),
        spec: {
          schedule: data.key2pfxCronCode,
          jobTemplate: {
            spec: jobTemplate,
          },
        },
      },
    });
});
