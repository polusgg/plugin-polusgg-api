import { InnerCustomNetworkTransformGeneric } from "../innerNetObjects/innerCustomNetworkTransformGeneric";
import { InnerClickBehaviour, InnerCooldownBehaviour, InnerGraphic } from "../innerNetObjects";
import { BaseInnerNetEntity } from "../../../../lib/protocol/entities/baseEntity";
import { LobbyInstance } from "../../../../lib/api/lobby";
import { SpawnFlag } from "../../../../lib/types/enums";
import { Vector2 } from "../../../../lib/types";

// TODO: Rewrite to not suck ass

export class EntityCooldownButton extends BaseInnerNetEntity {
  constructor(
    lobby: LobbyInstance,
    resourceId: number,
    resourceWidth: number,
    resourceHeight: number,
    position: Vector2,
    maxTimer: number,
    currentTime: number = 0,
    color: [number, number, number, number] = [255, 255, 255, 255],
    isCountingDown: boolean = true,
    velocity: Vector2 = Vector2.zero(),
    customNetworkTransformNetId: number = lobby.getHostInstance().getNextNetId(),
    graphicNetId: number = lobby.getHostInstance().getNextNetId(),
    clickBehaviourNetId: number = lobby.getHostInstance().getNextNetId(),
    cooldownBehaviourNetId: number = lobby.getHostInstance().getNextNetId(),
    sequenceId: number = 5,
  ) {
    super(0x82, lobby, 0x42069, SpawnFlag.None)

    this.innerNetObjects = [
      new InnerCustomNetworkTransformGeneric(this, position, velocity, sequenceId, customNetworkTransformNetId),
      new InnerGraphic(this, resourceId, resourceWidth, resourceHeight, graphicNetId),
      new InnerClickBehaviour(this, clickBehaviourNetId),
      new InnerCooldownBehaviour(this, maxTimer, currentTime, color, isCountingDown, cooldownBehaviourNetId),
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

  getCooldownBehaviour(): InnerCooldownBehaviour {
    return this.getObject(3);
  }

  despawn(): void {
    for (let i = 0; i < this.innerNetObjects.length; i++) {
      this.lobby.despawn(this.innerNetObjects[i]);
    }
  }
}

