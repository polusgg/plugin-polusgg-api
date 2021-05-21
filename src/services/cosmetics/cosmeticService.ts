import { Player } from "@nodepolus/framework/src/player";
import { SetPlayerBodyPacket } from "../../packets/rpc/playerControl/setPlayerBody";

export class CosmeticService {
  setBody(player: Player, body: number): void {
    player.getEntity().getPlayerControl().sendRpcPacket(new SetPlayerBodyPacket(body), player.getLobby().getConnections());
  }
}
