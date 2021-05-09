import { Bindable, Coroutine } from "./coroutine";

export class CoroutineManagerService {
  beginCoroutine<T extends Generator<void, void, number>, B extends Bindable>(bindTo: B, coroutine: T): Coroutine<B> {
    return new Coroutine<B>(coroutine).bind(bindTo).begin();
  }
}
