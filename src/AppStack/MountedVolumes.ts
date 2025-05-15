import type { IVolume, IVolumeMount } from 'kubernetes-models/v1';
import type { MountedVolumes } from './types.js';

interface MountVolumePayload {
  containerVolumeMounts: IVolumeMount[];
  volumes: IVolume[];
}

export class MountedVolumeProcessor {
  private input: MountedVolumes[] | undefined;

  constructor(input?: MountedVolumes[]) {
    this.input = input;
  }

  public process(): MountVolumePayload {
    const result: MountVolumePayload = {
      containerVolumeMounts: [],
      volumes: [],
    };

    if (!this.input) return result;

    for (const volume of this.input) {
      result.containerVolumeMounts.push({
        ...volume.mountOptions,
        name: volume.name,
        mountPath: volume.mountPath,
      });

      const { name, mountPath, mountOptions, ...volumeSpec } = volume;
      result.volumes.push({
        ...volumeSpec,
        name,
      });
    }

    return result;
  }
}
