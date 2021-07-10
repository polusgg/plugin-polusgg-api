import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { GameDataPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { Asset } from "@nodepolus/framework/src/protocol/polus/assets";
import { EntityPointOfInterest } from "@nodepolus/framework/src/protocol/polus/entities";
import { Vector2 } from "@nodepolus/framework/src/types";

export class PointOfInterestManagerService {
  async spawnPointOfInterest(connection: Connection, asset: Asset, position: Vector2): Promise<EntityPointOfInterest> {
    connection.assertLoaded(asset);

    const entity = new EntityPointOfInterest(connection, asset.getId(), position);

    await connection.writeReliable(new GameDataPacket([
      entity.serializeSpawn(),
    ], connection.getLobby()!.getCode()));

    return entity;
  }
}
