import { InnerCustomNetworkTransformGeneric } from "../innerNetObjects/innerCustomNetworkTransformGeneric";
import { BaseInnerNetEntity } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { InnerClickBehaviour, InnerGraphic } from "../innerNetObjects";
import { SpawnFlag } from "@nodepolus/framework/src/types/enums";
import { Vector2 } from "@nodepolus/framework/src/types";
import { EdgeAlignments } from "../types/enums/edgeAlignment";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { Attachable } from "../types/attachable";
import { GameDataPacket } from "@nodepolus/framework/src/protocol/packets/root";

export class EntityButton extends BaseInnerNetEntity {
  constructor(
    private readonly owner: Connection,
    resourceId: number,
    maxTimer: number,
    position: Vector2,
    alignment: EdgeAlignments = EdgeAlignments.None,
    currentTime: number = 0,
    saturated: boolean = true,
    color: [number, number, number, number] = [255, 255, 255, 255],
    isCountingDown: boolean = true,
    z: number = -50,
    attachedTo: number = -1,
    customNetworkTransformNetId: number = owner.getLobby()!.getHostInstance().getNextNetId(),
    graphicNetId: number = owner.getLobby()!.getHostInstance().getNextNetId(),
    clickBehaviourNetId: number = owner.getLobby()!.getHostInstance().getNextNetId(),
  ) {
    super(0x81, owner.getLobby()!, owner.getId(), SpawnFlag.None);

    this.innerNetObjects = [
      new InnerCustomNetworkTransformGeneric(this, alignment, position, z, attachedTo, customNetworkTransformNetId),
      new InnerGraphic(this, resourceId, graphicNetId),
      new InnerClickBehaviour(this, maxTimer, currentTime, saturated, color, isCountingDown, clickBehaviourNetId),
    ];
  }

  async attach(to: Attachable, sendTo: Connection[] = [this.owner]): Promise<void> {
    const data = this.getCustomNetworkTransform().setAttachedTo(to).serializeData();

    this.owner.getLobby()?.sendRootGamePacket(new GameDataPacket([
      data
    ], this.owner.getLobby()!.getCode()), sendTo);
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

