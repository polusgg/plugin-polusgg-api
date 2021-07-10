import { GameDataPacket } from "@nodepolus/framework/src/protocol/packets/root/gameDataPacket";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { EntityLightSource } from "@nodepolus/framework/src/protocol/polus/entities/entityLightSource";
import { Vector2 } from "@nodepolus/framework/src/types";

export class LightManagerService {
  async spawnPointOfInterest(owner: Connection, radius: number, position: Vector2): Promise<EntityLightSource> {
    const entity = new EntityLightSource(owner, radius, position);

    await owner.writeReliable(new GameDataPacket([
      entity.serializeSpawn(),
    ], owner.getLobby()!.getCode()));

    return entity;
  }
}
