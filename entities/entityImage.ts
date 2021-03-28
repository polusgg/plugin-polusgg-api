import { InnerCustomNetworkTransformGeneric } from "../innerNetObjects/innerCustomNetworkTransformGeneric";
import { BaseInnerNetEntity } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { EdgeAlignments } from "../types/enums/edgeAlignment";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { SpawnFlag } from "@nodepolus/framework/src/types/enums";
import { InnerGraphic } from "../innerNetObjects";
import { Vector2 } from "@nodepolus/framework/src/types";

// TODO: Rewrite to not suck ass

export class EntityImage extends BaseInnerNetEntity {
  constructor(
    lobby: LobbyInstance,
    resourceId: number,
    position: Vector2,
    alignment: EdgeAlignments = EdgeAlignments.LeftBottom,
    customNetworkTransformNetId: number = lobby.getHostInstance().getNextNetId(),
    graphicNetId: number = lobby.getHostInstance().getNextNetId(),
  ) {
    super(0x80, lobby, 0x42069, SpawnFlag.None);

    this.innerNetObjects = [
      new InnerGraphic(this, resourceId, graphicNetId),
      new InnerCustomNetworkTransformGeneric(this, alignment, position, customNetworkTransformNetId),
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

