import { Player as BasePlayer } from "@nodepolus/framework/src/player";

declare module "@nodepolus/framework/src/player" {
  class Player extends BasePlayer {
    setBody(body: number): void;
  }
}
