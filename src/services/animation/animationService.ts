import { CameraAnimationKeyframe } from "./keyframes/camera";
import { EntityCameraController } from "../../entities";
import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { Player } from "@nodepolus/framework/src/player";
import { BeginPlayerAnimation } from "../../packets/rpc/playerControl/beginAnimation";
import { PlayerAnimationKeyframe } from "./keyframes/player";
import { SetOutlinePacket } from "../../packets/rpc/playerControl/setOutline";
import { SetOpacityPacket } from "../../packets/rpc/playerControl/setOpacity";
import { Connection } from "@nodepolus/framework/src/protocol/connection";

export class AnimationService {
  async beginCameraAnimation(connection: Connection, cameraController: EntityCameraController, keyframes: CameraAnimationKeyframe[], reset: boolean = true): Promise<Promise<void>> {
    await cameraController.beginAnimation(connection, keyframes, reset);

    return new Promise(resolve => {
      setTimeout(resolve, keyframes.map(keyframe => keyframe.getDuration()).reduce((sum, current) => sum + current, 0));
    });
  }

  async beginPlayerAnimation(player: PlayerInstance, keyframes: PlayerAnimationKeyframe[], reset: boolean = true): Promise<Promise<void>> {
    await (player as Player).getEntity().getPlayerControl().sendRpcPacket(new BeginPlayerAnimation(keyframes, reset));

    return new Promise(resolve => {
      setTimeout(resolve, keyframes.map(keyframe => keyframe.getDuration()).reduce((sum, current) => sum + current, 0));
    });
  }

  async setOutline(player: PlayerInstance, color: [number, number, number, number] | number[]): Promise<void> {
    await (player as Player).getEntity().getPlayerControl().sendRpcPacket(new SetOutlinePacket(true, color));
  }

  async clearOutline(player: PlayerInstance): Promise<void> {
    await (player as Player).getEntity().getPlayerControl().sendRpcPacket(new SetOutlinePacket(false, [0, 0, 0, 0]));
  }

  async setOpacity(player: PlayerInstance, opacity: number): Promise<void> {
    if (opacity > 1 || opacity < 0) {
      throw new RangeError("Opacity out of range. Needs to be between 0 and 1");
    }

    await (player as Player).getEntity().getPlayerControl().sendRpcPacket(new SetOpacityPacket(Math.floor(opacity * 255)));
  }
}
