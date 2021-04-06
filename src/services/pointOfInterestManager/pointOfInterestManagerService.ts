import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { GameDataPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { Vector2 } from "@nodepolus/framework/src/types";
import { EntityPointOfInterest } from "../../entities";

export class PointOfInterestManagerService {
  async spawnPointOfInterest(owner: Connection, resourceId: number, position: Vector2): Promise<EntityPointOfInterest> {
    const entity = new EntityPointOfInterest(owner, resourceId, position);

    await owner.writeReliable(new GameDataPacket([
      entity.serializeSpawn(),
    ], owner.getLobby()!.getCode()));

    return entity;
  }
}
