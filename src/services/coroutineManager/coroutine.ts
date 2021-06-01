import { Game } from "@nodepolus/framework/src/api/game";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { Player } from "@nodepolus/framework/src/player";
import { Lobby } from "@nodepolus/framework/src/lobby";

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = (Without<T, U> & U) | (Without<U, T> & T);

type AllXOR<T extends unknown[]> =
  T extends [infer Only] ? Only :
    T extends [infer A, infer B, ...infer Rest] ? AllXOR<[XOR<A, B>, ...Rest]> :
      never;

export type Bindable = AllXOR<[PlayerInstance, Game, LobbyInstance]>;

export class Coroutine<BoundTo extends Bindable> {
  protected timer: NodeJS.Timeout | undefined;
  protected boundTo: BoundTo | undefined;

  constructor(protected readonly gen: Generator<void, void, number>) {}

  bind(o: BoundTo): this {
    this.boundTo = o;

    return this;
  }

  begin(interval: number = 20): this {
    if (this.boundTo === undefined) {
      throw new Error("Attempted to begin coroutine without binding it first");
    }

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

      this.gen.next(now - dt);

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
    return p.getLobby().getPlayers().indexOf(p) <= -1;
  }

  protected shouldEndLobby(l: Lobby): boolean {
    return l === l.getServer().getLobby(l.getCode());
  }

  protected shouldEndGame(g: Game): boolean {
    return g === g.getLobby().getGame();
  }
}
