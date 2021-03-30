import { InnerCustomNetworkTransformGeneric } from "../innerNetObjects/innerCustomNetworkTransformGeneric";
import { BaseInnerNetEntity } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { GLOBAL_OWNER } from "@nodepolus/framework/src/util/constants";
import { EdgeAlignments } from "../types/enums/edgeAlignment";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { SpawnFlag } from "@nodepolus/framework/src/types/enums";
import { InnerDeadBody } from "../innerNetObjects";
import { Vector2 } from "@nodepolus/framework/src/types";
import { BodyDirection } from "../types/enums";

// TODO: Rewrite to not suck ass

export class EntityDeadBody extends BaseInnerNetEntity {
  constructor(
    lobby: LobbyInstance,
    reportable: boolean,
    color: [number, number, number, number],
    shadowColor: [number, number, number, number],
    position: Vector2,
    alignment: EdgeAlignments = EdgeAlignments.LeftBottom,
    hasFallen: boolean = false,
    bodyFacing: BodyDirection = BodyDirection.FacingLeft,
    deadBodyNetId: number = lobby.getHostInstance().getNextNetId(),
    customNetworkTransformNetId: number = lobby.getHostInstance().getNextNetId(),
  ) {
    super(0x83, lobby, GLOBAL_OWNER, SpawnFlag.None);

    this.innerNetObjects = [
      new InnerDeadBody(this, color, shadowColor, hasFallen, bodyFacing, deadBodyNetId),
      new InnerCustomNetworkTransformGeneric(this, alignment, position, customNetworkTransformNetId),
    ];
  }

  getDeadBody(): InnerDeadBody {
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
