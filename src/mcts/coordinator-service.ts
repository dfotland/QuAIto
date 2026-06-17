import {
  createWorkerContext,
  GameRegistry,
  handleWorkerMessage,
  InProcessWorkerPort,
  MCTSSearchCoordinator,
  MCTSWorkerPort,
  postReady,
  quartoCoordinatorAdapter,
  registerQuarto,
  type WorkerPort,
} from '@smart-games/mcts';

import workerUrl from './worker-entry?worker&url';

const WORKER_READY_TIMEOUT_MS = 5000;

let coordinator: MCTSSearchCoordinator | null = null;
let initPromise: Promise<MCTSSearchCoordinator> | null = null;

function createQuartoRegistry(): GameRegistry {
  const registry = new GameRegistry();
  registerQuarto(registry);
  return registry;
}

function createInProcessPort(registry: GameRegistry): InProcessWorkerPort {
  const context = createWorkerContext();
  const sink: { port: InProcessWorkerPort | null } = { port: null };

  const port = new InProcessWorkerPort((message) => {
    handleWorkerMessage(
      registry,
      context,
      message,
      (out) => sink.port!.emit(out),
      (progress) => sink.port!.emit(progress),
    );
  });

  sink.port = port;
  postReady(registry, (message) => port.emit(message));
  return port;
}

async function createWorkerPort(): Promise<WorkerPort> {
  if (typeof Worker === 'undefined') {
    return createInProcessPort(createQuartoRegistry());
  }

  try {
    const port = new MCTSWorkerPort(workerUrl);
    await Promise.race([
      port.ready,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('MCTS worker ready timeout')), WORKER_READY_TIMEOUT_MS);
      }),
    ]);
    return port;
  } catch (error) {
    console.warn('MCTS web worker unavailable; using in-process search.', error);
    return createInProcessPort(createQuartoRegistry());
  }
}

async function createCoordinator(): Promise<MCTSSearchCoordinator> {
  const port = await createWorkerPort();
  return new MCTSSearchCoordinator(port, quartoCoordinatorAdapter);
}

export function getQuartoMctsCoordinator(): Promise<MCTSSearchCoordinator> {
  if (coordinator !== null) {
    return Promise.resolve(coordinator);
  }

  initPromise ??= createCoordinator().then((instance) => {
    coordinator = instance;
    return instance;
  });

  return initPromise;
}

export function stopQuartoMctsSearch(): void {
  coordinator?.stop();
}

export function disposeQuartoMctsCoordinator(): void {
  coordinator?.dispose();
  coordinator = null;
  initPromise = null;
}
