import { InnerCustomNetworkTransformGeneric } from "../innerNetObjects/innerCustomNetworkTransformGeneric";
import { BaseInnerNetEntity } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { InnerClickBehaviour, InnerGraphic } from "../innerNetObjects";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { SpawnFlag } from "@nodepolus/framework/src/types/enums";
import { Vector2 } from "@nodepolus/framework/src/types";
import { EdgeAlignments } from "../types/enums/edgeAlignment";

// TODO: Rewrite to not suck ass

export class EntityButton extends BaseInnerNetEntity {
  constructor(
    lobby: LobbyInstance,
    resourceId: number,
    position: Vector2,
    alignment: EdgeAlignments = EdgeAlignments.LeftBottom,
    customNetworkTransformNetId: number = lobby.getHostInstance().getNextNetId(),
    graphicNetId: number = lobby.getHostInstance().getNextNetId(),
    clickBehaviourNetId: number = lobby.getHostInstance().getNextNetId(),
  ) {
    super(0x81, lobby, 0x42069, SpawnFlag.None);

    this.innerNetObjects = [
      new InnerCustomNetworkTransformGeneric(this, alignment, position, customNetworkTransformNetId),
      new InnerGraphic(this, resourceId, graphicNetId),
      new InnerClickBehaviour(this, clickBehaviourNetId),
    ];
  }

  getCustomNetworkTransform(): InnerCustomNetworkTransformGeneric {
    return this.getObject(0);
  }

  getGraphic(): InnerGraphic {
    return this.getObject(1);
  }

  getClickBehaviour(): InnerClickBehaviour {
    return this.getObject(2);
  }

  despawn(): void {
    for (let i = 0; i < this.innerNetObjects.length; i++) {
      this.lobby.despawn(this.innerNetObjects[i]);
    }
  }
}
