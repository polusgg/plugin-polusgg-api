import { InnerCustomNetworkTransformGeneric } from "../innerNetObjects/innerCustomNetworkTransformGeneric";
import { BaseInnerNetEntity } from "../../../../lib/protocol/entities/baseEntity";
import { InnerClickBehaviour, InnerGraphic } from "../innerNetObjects";
import { LobbyInstance } from "../../../../lib/api/lobby";
import { SpawnFlag } from "../../../../lib/types/enums";
import { Vector2 } from "../../../../lib/types";
import { InnerConsoleBehaviour } from "../innerNetObjects/innerConsoleBehaviour";

// TODO: Rewrite to not suck ass

export class EntityConsole extends BaseInnerNetEntity {
  constructor(
    lobby: LobbyInstance,
    resourceId: number,
    resourceWidth: number,
    resourceHeight: number,
    position: Vector2,
    velocity: Vector2 = Vector2.zero(),
    customNetworkTransformNetId: number = lobby.getHostInstance().getNextNetId(),
    graphicNetId: number = lobby.getHostInstance().getNextNetId(),
    clickBehaviourNetId: number = lobby.getHostInstance().getNextNetId(),
    consoleBehaviourNetId: number = lobby.getHostInstance().getNextNetId(),
    sequenceId: number = 5,
  ) {
    super(0x84, lobby, 0x42069, SpawnFlag.None)

    this.innerNetObjects = [
      new InnerCustomNetworkTransformGeneric(this, position, velocity, sequenceId, customNetworkTransformNetId),
      new InnerGraphic(this, resourceId, resourceWidth, resourceHeight, graphicNetId),
      new InnerClickBehaviour(this, clickBehaviourNetId),
      new InnerConsoleBehaviour(this, consoleBehaviourNetId),
    ]
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

