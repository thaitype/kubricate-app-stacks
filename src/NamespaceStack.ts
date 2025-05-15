import { ResourceComposer, BaseStack } from '@kubricate/core';
import { Namespace } from 'kubernetes-models/v1';

export interface INamestack {
  name: string;
}

function configureComposer(data: INamestack) {
  return new ResourceComposer().addClass({
    id: 'namespace',
    type: Namespace,
    config: {
      metadata: {
        name: `${data.name}-ns`,
      },
    },
  });
}

export class NamespaceStack extends BaseStack<typeof configureComposer> {
  constructor() {
    super();
  }

  from(data: INamestack) {
    const composer = configureComposer(data);
    this.setComposer(composer);
    return this;
  }
}
