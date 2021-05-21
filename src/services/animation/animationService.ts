import { CameraAnimationKeyframe } from "./keyframes/camera";
import { EntityCameraController } from "../../entities";
import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { Player } from "@nodepolus/framework/src/player";
import { BeginPlayerAnimation } from "../../packets/rpc/playerControl/beginAnimation";
import { PlayerAnimationKeyframe } from "./keyframes/player";
import { SetOutlinePacket } from "../../packets/rpc/playerControl/setOutline";
import { SetOpacityPacket } from "../../packets/rpc/playerControl/setOpacity";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { GameDataPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { RpcPacket } from "@nodepolus/framework/src/protocol/packets/gameData";
import { PlayerAnimationFields } from "@polusgg/plugin-polusgg-api/src/types/playerAnimationFields";

export class AnimationService {
  async beginCameraAnimation(connection: Connection, cameraController: EntityCameraController, keyframes: CameraAnimationKeyframe[], reset: boolean = true): Promise<Promise<void>> {
    await cameraController.beginAnimation(connection, keyframes, reset);

    return new Promise(resolve => {
      setTimeout(resolve, keyframes.map(keyframe => keyframe.getDuration()).reduce((sum, current) => sum + current, 0));
    });
  }

  async beginPlayerAnimation(player: PlayerInstance, enabledFields: PlayerAnimationFields, keyframes: PlayerAnimationKeyframe[], reset: boolean = true): Promise<Promise<void>> {
    // yeah it's ugly but if you think it's that bad then rewrite it yourself.
    const bitfield = [enabledFields.opacity, enabledFields.hatOpacity, enabledFields.petOpacity, enabledFields.skinOpacity, enabledFields.primaryColor, enabledFields.primaryColor, enabledFields.secondaryColor, enabledFields.tertiaryColor, enabledFields.scale, enabledFields.position, enabledFields.angle];

    await (player as Player).getEntity().getPlayerControl().sendRpcPacket(new BeginPlayerAnimation(bitfield, keyframes, reset), player.getLobby().getConnections());

    return new Promise(resolve => {
      setTimeout(resolve, keyframes.map(keyframe => keyframe.getDuration()).reduce((sum, current) => sum + current, 0));
    });
  }

  async setOutline(player: PlayerInstance, color: [number, number, number, number] | number[], setFor: Connection[] = player.getLobby().getConnections()): Promise<void> {
    const proms = new Array<Promise<void>>(setFor.length);

    for (let i = 0; i < setFor.length; i++) {
      const connection = setFor[i];

      proms[i] = connection.writeReliable(new GameDataPacket([
        new RpcPacket((player as Player).getEntity().getPlayerControl().getNetId(), new SetOutlinePacket(true, color)),
      ], connection.getLobby()!.getCode()));
    }

    await Promise.all(proms);
  }

  async clearOutline(player: PlayerInstance): Promise<void> {
    await (player as Player).getEntity().getPlayerControl().sendRpcPacket(new SetOutlinePacket(false, [0, 0, 0, 0]), player.getLobby().getConnections());
  }

  async setOpacity(player: PlayerInstance, opacity: number): Promise<void> {
    if (opacity > 1 || opacity < 0) {
      throw new RangeError("Opacity out of range. Needs to be between 0 and 1");
    }

    await (player as Player).getEntity().getPlayerControl().sendRpcPacket(new SetOpacityPacket(Math.floor(opacity * 255)), player.getLobby().getConnections());
  }
}
