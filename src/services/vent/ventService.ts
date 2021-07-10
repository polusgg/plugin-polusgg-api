import { Lobby } from "@nodepolus/framework/src/lobby";
import { Vents } from "@nodepolus/framework/src/static";
import { DespawnVentsPacket } from "@nodepolus/framework/src/protocol/polus/packets/rpc/shipStatus/despawnVents";

export class VentService {
  async despawnAllVents(lobby: Lobby): Promise<void> {
    await this.despawnVents(lobby, Vents.forLevel(lobby.getLevel()).map(vent => vent.getId()));
  }

  async despawnVents(lobby: Lobby, vents: number[]): Promise<void> {
    await lobby.sendRpcPacket(
      lobby.getShipStatus()!.getShipStatus(),
      new DespawnVentsPacket(vents),
    );
  }

  // todo spawn vents using vent entity
}
