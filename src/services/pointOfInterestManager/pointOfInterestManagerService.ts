import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { GameDataPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { Vector2 } from "@nodepolus/framework/src/types";
import { Services } from "..";
import { Asset } from "../../assets";
import { EntityPointOfInterest } from "../../entities";
import { ServiceType } from "../../types/enums";
import { Attachable } from "../../types/attachable";
import { InnerCustomNetworkTransformGeneric } from "../../innerNetObjects/innerCustomNetworkTransformGeneric";

export class PointOfInterestManagerService {
  async spawnPointOfInterest(connection: Connection, asset: Asset, position: Vector2, attachedTo?: Attachable): Promise<EntityPointOfInterest> {
    await Services.get(ServiceType.Resource).assertLoaded(connection, asset);

    const parent = attachedTo === undefined ? undefined : InnerCustomNetworkTransformGeneric.findOwner(attachedTo);

    const entity = new EntityPointOfInterest(connection, asset.getId(), position, undefined, parent);

    await connection.writeReliable(new GameDataPacket([
      entity.serializeSpawn(),
    ], connection.getLobby()!.getCode()));

    return entity;
  }
}
