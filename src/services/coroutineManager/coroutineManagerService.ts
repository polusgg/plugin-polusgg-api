import { Bindable, Coroutine } from "./coroutine";

export class CoroutineManagerService {
  beginCoroutine<T extends Coroutine<B>, B extends Bindable>(bindTo: B, coroutine: T): T {
    coroutine.bind(bindTo).begin();

    return coroutine;
  }
}
