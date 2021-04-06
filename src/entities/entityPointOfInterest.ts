import { BaseInnerNetEntity } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { SpawnFlag } from "@nodepolus/framework/src/types/enums";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { InnerPointOfInterest } from "../innerNetObjects";
import { InnerCustomNetworkTransformGeneric } from "../innerNetObjects/innerCustomNetworkTransformGeneric";
import { EdgeAlignments } from "../types/enums/edgeAlignment";
import { Vector2 } from "@nodepolus/framework/src/types";
import { GameDataPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { RpcPacket } from "@nodepolus/framework/src/protocol/packets/gameData";
import { SnapToPacket } from "../packets/rpc/customNetworkTransform";

export class EntityPointOfInterest extends BaseInnerNetEntity {
  constructor(
    owner: Connection,
    resourceId: number,
    position: Vector2 = Vector2.zero(),
    cameraControllerNetId: number = owner.getLobby()!.getHostInstance().getNextNetId(),
    customNetworkTransformNetId: number = owner.getLobby()!.getHostInstance().getNextNetId(),
  ) {
    super(0x88, owner.getLobby()!, owner.getId(), SpawnFlag.None);

    this.innerNetObjects = [
      new InnerPointOfInterest(this, cameraControllerNetId, resourceId),
      new InnerCustomNetworkTransformGeneric(this, EdgeAlignments.None, position, customNetworkTransformNetId),
    ];
  }

  getPosition(): Vector2 {
    return this.getCustomNetworkTransform().getPosition();
  }

  async setPosition(position: Vector2): Promise<void> {
    const data = this.getCustomNetworkTransform().setPosition(position).serializeData();

    return this.getLobby().findSafeConnection(this.getOwnerId()).writeReliable(new GameDataPacket([
      data,
    ], this.getLobby().getCode()));
  }

  async snapPosition(position: Vector2): Promise<void> {
    this.getCustomNetworkTransform().setPosition(position);

    return this.getLobby().findSafeConnection(this.getOwnerId()).writeReliable(new GameDataPacket([
      new RpcPacket(
        this.getCustomNetworkTransform().getNetId(),
        new SnapToPacket(position),
      ),
    ], this.getLobby().getCode()));
  }

  getResourceId(): number {
    return this.getPointOfInterest().getResourceId();
  }

  getPointOfInterest(): InnerPointOfInterest {
    return this.getObject(0);
  }

  getCustomNetworkTransform(): InnerCustomNetworkTransformGeneric {
    return this.getObject(1);
  }

  despawn(): void {
    for (let i = 0; i < this.innerNetObjects.length; i++) {
      this.lobby.despawn(this.innerNetObjects[i]);
    }
  }
}

