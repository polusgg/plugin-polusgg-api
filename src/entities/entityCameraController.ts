import { BaseInnerNetEntity } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { SpawnFlag } from "@nodepolus/framework/src/types/enums";
import { Vector2 } from "@nodepolus/framework/src/types";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { InnerCameraController } from "../innerNetObjects/innerCameraControl";

// TODO: Rewrite to not suck ass

export class EntityCameraController extends BaseInnerNetEntity {
  constructor(
    owner: Connection,
    scale: Vector2 = Vector2.one(),
    cameraControllerNetId: number = owner.getLobby()!.getHostInstance().getNextNetId(),
  ) {
    super(0x88, owner.getLobby()!, owner.getId(), SpawnFlag.None);

    this.innerNetObjects = [
      new InnerCameraController(this, cameraControllerNetId, scale),
    ];
  }

  getScale(): Vector2 {
    return this.getCameraController().getScale();
  }

  setScale(scale: Vector2): this {
    this.getCameraController().setScale(scale);

    return this;
  }

  getCameraController(): InnerCameraController {
    return this.getObject(0);
  }

  despawn(): void {
    for (let i = 0; i < this.innerNetObjects.length; i++) {
      this.lobby.despawn(this.innerNetObjects[i]);
    }
  }
}

