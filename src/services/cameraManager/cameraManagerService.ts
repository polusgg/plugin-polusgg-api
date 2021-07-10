import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { GameDataPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { Server } from "@nodepolus/framework/src/server";
import { EntityCameraController } from "@nodepolus/framework/src/protocol/polus/entities";

declare const server: Server;

export class CameraManagerService {
  constructor() {
    server.on("player.joined", event => {
      const cameraController = new EntityCameraController(event.getPlayer().getSafeConnection());

      event.getPlayer().getSafeConnection().writeReliable(new GameDataPacket([
        cameraController.serializeSpawn(),
      ], event.getLobby().getCode()));

      event.getPlayer().setMeta("pgg.api.cameraController", cameraController);
    });
  }

  getController(player: PlayerInstance): EntityCameraController {
    return player.getMeta<EntityCameraController>("pgg.api.cameraController");
  }
}
