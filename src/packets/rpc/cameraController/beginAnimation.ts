import { BaseRpcPacket } from "@nodepolus/framework/src/protocol/packets/rpc";
import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { CameraAnimationKeyframe } from "../../../services/animation/keyframes/camera";

export class BeginCameraAnimation extends BaseRpcPacket {
  constructor(
    public keyframes: CameraAnimationKeyframe[],
    public reset: boolean,
  ) {
    super(0x93);
  }

  static deserialize(reader: MessageReader): BeginCameraAnimation {
    const keyframes: CameraAnimationKeyframe[] = [];

    while (reader.getCursor() < reader.getLength() - 1) {
      keyframes.push(CameraAnimationKeyframe.deserialize(reader.readMessage()!));
    }

    return new BeginCameraAnimation(keyframes, reader.readBoolean());
  }

  serialize(writer: MessageWriter): void {
    for (let i = 0; i < this.keyframes.length; i++) {
      this.keyframes[i].serialize(writer);
    }

    writer.writeBoolean(this.reset);
  }

  clone(): BeginCameraAnimation {
    return new BeginCameraAnimation(this.keyframes.map(c => c.clone()), this.reset);
  }
}
