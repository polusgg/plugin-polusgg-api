import { InnerCustomNetworkTransformGeneric } from "../innerNetObjects/innerCustomNetworkTransformGeneric";
import { BaseInnerNetEntity } from "../../../../lib/protocol/entities/baseEntity";
import { InnerGraphic } from "../innerNetObjects";
import { LobbyInstance } from "../../../../lib/api/lobby";
import { SpawnFlag } from "../../../../lib/types/enums";
import { Vector2 } from "../../../../lib/types";

// TODO: Rewrite to not suck ass

export class EntityImage extends BaseInnerNetEntity {
  constructor(
    lobby: LobbyInstance,
    resourceId: number,
    position: Vector2,
    velocity: Vector2 = Vector2.zero(),
    customNetworkTransformNetId: number = lobby.getHostInstance().getNextNetId(),
    graphicNetId: number = lobby.getHostInstance().getNextNetId(),
    sequenceId: number = 5,
  ) {
    super(0x80, lobby, 0x42069, SpawnFlag.None);

    this.innerNetObjects = [
      new InnerCustomNetworkTransformGeneric(this, position, velocity, sequenceId, customNetworkTransformNetId),
      new InnerGraphic(this, resourceId, graphicNetId),
    ];
  }

  getCustomNetworkTransform(): InnerCustomNetworkTransformGeneric {
    return this.getObject(0);
  }

  getGraphic(): InnerGraphic {
    return this.getObject(1);
  }

  despawn(): void {
    for (let i = 0; i < this.innerNetObjects.length; i++) {
      this.lobby.despawn(this.innerNetObjects[i]);
    }
  }
}

