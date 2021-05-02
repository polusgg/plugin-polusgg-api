export class Coroutine {
  protected readonly gen: Generator<unknown, any, unknown>;

  constructor(fn: GeneratorFunction) {
    this.gen = fn();
  }
}
