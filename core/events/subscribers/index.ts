import { registerLoggerSubscriber } from './logger';
import { registerImpactEventsSubscriber } from './impact-events';
import { registerRecognitionSubscriber } from './recognition';

let _registered = false;

export function registerEventSubscribers(): void {
  if (_registered) return;
  _registered = true;

  registerLoggerSubscriber();
  registerImpactEventsSubscriber();
  registerRecognitionSubscriber();
}
