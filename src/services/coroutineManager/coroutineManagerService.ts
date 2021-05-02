import { Game } from "@nodepolus/framework/src/api/game";
import { Lobby } from "@nodepolus/framework/src/lobby";
import { Player } from "@nodepolus/framework/src/player";
import { Coroutine } from "./coroutine";

export class CoroutineManagerService {
  beginCoroutine<T extends Coroutine>(bindTo: Player | Lobby | Game, coroutine: T): T {
    
  }
}
