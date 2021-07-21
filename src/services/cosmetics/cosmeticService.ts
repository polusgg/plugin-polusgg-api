import { Player } from "@nodepolus/framework/src/player";
import { SetPlayerBodyPacket } from "../../packets/rpc/playerControl/setPlayerBody";

export class CosmeticService {
  constructor() {
  }

  // async setHat(player: Player)
  async setBody(player: Player, body: number): Promise<void> {
    await player.getEntity().getPlayerControl().sendRpcPacket(new SetPlayerBodyPacket(body), player.getLobby().getConnections());
  }
}
