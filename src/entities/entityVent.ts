import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { BaseInnerNetEntity } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { Vector2 } from "@nodepolus/framework/src/types";
import { SpawnFlag } from "@nodepolus/framework/src/types/enums";
import { GLOBAL_OWNER } from "@nodepolus/framework/src/util/constants";
import { InnerCustomNetworkTransformGeneric } from "../innerNetObjects/innerCustomNetworkTransformGeneric";
import { InnerVent } from "../innerNetObjects/innerVent";
import { EdgeAlignments } from "../types/enums/edgeAlignment";

export class EntityVent extends BaseInnerNetEntity {
  constructor(
    lobby: LobbyInstance,
    ventId: number,
    leftConnection: number,
    rightConnection: number,
    centerConnection: number,
    ventSpriteResourceId: number,
    enterVentAnimationResourceId: number,
    exitVentAnimationResourceId: number,
    position: Vector2 = Vector2.zero(),
    z: number = -50,
    attachedTo: number = -1,
    ventNetId: number = lobby.getHostInstance().getNextNetId(),
  ) {
    super(0x84, lobby, GLOBAL_OWNER, SpawnFlag.None);

    this.innerNetObjects = [
      new InnerVent(this, ventNetId, ventSpriteResourceId, enterVentAnimationResourceId, exitVentAnimationResourceId, ventId, leftConnection, rightConnection, centerConnection),
      new InnerCustomNetworkTransformGeneric(this, EdgeAlignments.None, position, z, attachedTo),
    ];
  }

  getVent(): InnerVent {
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
