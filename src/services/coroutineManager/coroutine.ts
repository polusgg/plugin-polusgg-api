import { Game } from "@nodepolus/framework/src/api/game";
import { Lobby } from "@nodepolus/framework/src/lobby";
import { Player } from "@nodepolus/framework/src/player";

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = (Without<T, U> & U) | (Without<U, T> & T);

type AllXOR<T extends unknown[]> =
  T extends [infer Only] ? Only :
    T extends [infer A, infer B, ...infer Rest] ? AllXOR<[XOR<A, B>, ...Rest]> :
      never;

export type Bindable = AllXOR<[Player, Game, Lobby]>;

interface GeneratorFunction<Arguments extends unknown[], TYield, TReturn, TNext> {
  /**
   * The length of the arguments.
   */
  readonly length: number;
  /**
   * Returns the name of the function.
   */
  readonly name: string;
  /**
   * A reference to the prototype.
   */
  readonly prototype: Generator;
  /**
   * Creates a new Generator object.
   * @param args - A list of arguments the function accepts.
   */
  new(...args: Arguments): Generator<TYield, TReturn, TNext>;
  /**
   * Creates a new Generator object.
   * @param args - A list of arguments the function accepts.
   */
  (...args: Arguments): Generator<TYield, TReturn, TNext>;
}

export class Coroutine<BoundTo extends Bindable> {
  protected gen: Generator<void, void, number> | undefined;
  protected timer: NodeJS.Timeout | undefined;
  protected boundTo: BoundTo | undefined;

  constructor(protected readonly fn: GeneratorFunction<[BoundTo], void, void, number>) {}

  bind(o: BoundTo): this {
    if (this.gen !== undefined) {
      throw new Error("Attempted to bind coroutine multiple times");
    }

    this.boundTo = o;
    this.gen = this.fn(o);

    return this;
  }

  begin(interval: number = 20): this {
    if (this.timer !== undefined) {
      throw new Error("Attempted to begin coroutine multiple times");
    }

    let dt = Date.now();

    this.timer = setInterval(() => {
      if (this.shouldEnd()) {
        clearInterval(this.timer!);

        return;
      }

      const now = Date.now();

      this.gen?.next(now - dt);

      dt = now;
    }, interval);

    return this;
  }

  protected shouldEnd(): boolean {
    if (this.boundTo === undefined) {
      throw new Error("call to shouldEnd while boundTo is undefined");
    }

    if (this.boundTo instanceof Player) {
      return this.shouldEndPlayer(this.boundTo);
    }

    if (this.boundTo instanceof Lobby) {
      return this.shouldEndLobby(this.boundTo);
    }

    if (this.boundTo instanceof Game) {
      return this.shouldEndGame(this.boundTo as unknown as Game);
    }

    throw new Error("Invalid bind");
  }

  protected shouldEndPlayer(p: Player): boolean {
    return p.getLobby().getPlayers().indexOf(p) > -1;
  }

  protected shouldEndLobby(l: Lobby): boolean {
    return l === l.getServer().getLobby(l.getCode());
  }

  protected shouldEndGame(g: Game): boolean {
    return g === g.getLobby().getGame();
  }
}
