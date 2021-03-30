import { InnerCustomNetworkTransformGeneric } from "../innerNetObjects/innerCustomNetworkTransformGeneric";
import { BaseInnerNetEntity } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { InnerConsoleBehaviour } from "../innerNetObjects/innerConsoleBehaviour";
import { InnerClickBehaviour, InnerGraphic } from "../innerNetObjects";
import { EdgeAlignments } from "../types/enums/edgeAlignment";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { SpawnFlag } from "@nodepolus/framework/src/types/enums";
import { Vector2 } from "@nodepolus/framework/src/types";

// TODO: Rewrite to not suck ass

export class EntityConsole extends BaseInnerNetEntity {
  constructor(
    lobby: LobbyInstance,
    resourceId: number,
    canUse: number[],
    position: Vector2,
    alignment: EdgeAlignments = EdgeAlignments.None,
    customNetworkTransformNetId: number = lobby.getHostInstance().getNextNetId(),
    graphicNetId: number = lobby.getHostInstance().getNextNetId(),
    clickBehaviourNetId: number = lobby.getHostInstance().getNextNetId(),
    consoleBehaviourNetId: number = lobby.getHostInstance().getNextNetId(),
  ) {
    super(0x82, lobby, 0x42069, SpawnFlag.None);

    this.innerNetObjects = [
      new InnerConsoleBehaviour(this, canUse, consoleBehaviourNetId),
      new InnerClickBehaviour(this, clickBehaviourNetId),
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

  getClickBehaviour(): InnerClickBehaviour {
    return this.getObject(2);
  }

  getConsoleBehaviour(): InnerConsoleBehaviour {
    return this.getObject(3);
  }

  despawn(): void {
    for (let i = 0; i < this.innerNetObjects.length; i++) {
      this.lobby.despawn(this.innerNetObjects[i]);
    }
  }
}

