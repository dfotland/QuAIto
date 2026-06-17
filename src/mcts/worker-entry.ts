/// <reference lib="webworker" />

import type { WorkerToMainMessage } from '@smart-games/mcts';
import {
  createWorkerContext,
  GameRegistry,
  handleWorkerMessage,
  postReady,
  registerQuarto,
} from '@smart-games/mcts/worker-host';

const registry = new GameRegistry();
registerQuarto(registry);

const context = createWorkerContext();

self.addEventListener('message', (event: MessageEvent) => {
  handleWorkerMessage(
    registry,
    context,
    event.data,
    (message: WorkerToMainMessage) => self.postMessage(message),
    (message: WorkerToMainMessage) => self.postMessage(message),
  );
});

// Defer ready until the main thread has attached its message listener.
queueMicrotask(() => {
  postReady(registry, (message: WorkerToMainMessage) => self.postMessage(message));
});
