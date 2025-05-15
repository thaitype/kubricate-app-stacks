import type { IContainer, IVolume, IVolumeMount } from 'kubernetes-models/v1';
import type { CorsPreset, PresetType } from '@kubricate/toolkit';

export interface IPrivateAppStack {
  /**
   * App name (used in metadata, labels, service name, etc.)
   */
  name: string;

  /**
   * Kubernetes namespace to deploy to.
   * Defaults to "default" if not provided.
   */
  namespace?: string;

  /**
   * Unique suffix to avoid name collisions when sharing a namespace.
   * Required if `namespace` is not specified.
   */
  identifier?: string;

  /**
   * Container spec for the main app container
   */
  container: IContainer;

  /**
   * Number of pod replicas
   * @default 1
   */
  replicas?: number;

  /**
   * Optional image registry (e.g., ghcr.io/my-org)
   */
  imageRegistry: string;

  /**
   * Revision deployment mode
   * - `single`: one revision at a time (default)
   * - `multiple`: supports multiple co-existing versions (not yet implemented)
   */
  revisionsMode?: 'single' | 'multiple';

  /**
   * Optional volumes to attach to the container
   */
  volumes?: IVolume[];

  /**
   * Declarative list of volumes to mount into the main container.
   *
   * Each entry combines both `volume` and `volumeMount` definitions in a single structure.
   * The `name` is optional and will be auto-generated if omitted.
   *
   * - Volume types are based on Kubernetes `IVolume` (e.g. `persistentVolumeClaim`, `emptyDir`, `configMap`, `secret`, etc.)
   * - `mountPath` is required and specifies where the volume is mounted inside the container.
   * - `mountOptions` allows additional `volumeMounts` options like `readOnly`, `subPath`, etc., excluding `name` and `mountPath`.
   *
   * Example:
   * mountedVolumes: [
   *   {
   *     mountPath: '/https/',
   *     persistentVolumeClaim: { claimName: 'key2pfx-pvc' }
   *   },
   *   {
   *     mountPath: '/tmp/cache',
   *     emptyDir: {},
   *     mountOptions: { readOnly: true }
   *   }
   * ]
   */
  mountedVolumes?: MountedVolumes[];

  imagePullSecrets?: PrivateImageRegistrySecret[];

  port: number;

  storageSize?: string;
}

export type PrivateImageRegistrySecret = {
  name: string;
  username: string;
  password: string;
  registryDNS: string;
};

export type MountedVolumes = Omit<IVolume, 'name'> & {
  /**
   * name of the volume. Must be a DNS_LABEL and unique within the pod. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names
   */
  name: string;
  /**
   * Path within the container at which the volume should be mounted.  Must not contain ':'.
   */
  mountPath: string;
  /**
   * Mount options for the volume.
   * This is a list of options that can be used to customize the mount behavior.
   * For example, you can specify `readOnly` to mount the volume as read-only.
   */
  mountOptions?: Omit<NonNullable<IContainer['volumeMounts']>[number], 'name' | 'mountPath'>;
};

export interface ContainerOptions extends Omit<IContainer, 'image' | 'name' | 'ports' | 'resources' | 'env'> {
  name: string;
  image: string;
  /**
   * Number of CPU cores
   */
  cpu: number;
  /**
   * Memory size (Gi)
   */
  memory: number;
  /**
   * Preset modes for resource allocation.
   * - `conservative`: Prioritizes stability and efficiency with lower `requests` and limited `limits`.
   * - `optimized`: A balanced approach that optimizes resource usage without overcommitting.
   * - `aggressive`: Maximizes performance by using all allocated resources with high limits.
   *
   * @default 'conservative'
   */
  resourceAllocationPreset?: PresetType;
  env: EnvironmentApplication[];
  volumeMounts?: IVolumeMount[];
}

export interface EnvironmentApplication {
  name: string;
  value: string;
}

export interface EnvironmentOptions<EnvSecretRef extends keyof any = string> {
  /**
   * Environment variable name
   */
  name: string;
  /**
   * Environment variable value
   */
  value?: string;
  /**
   * Environment variable value from a secret
   */
  secretRef?: EnvSecretRef;
}
