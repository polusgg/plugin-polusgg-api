import { BaseRpcPacket } from "@nodepolus/framework/src/protocol/packets/rpc";
import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { PlayerAnimationKeyframe } from "../../../services/animation/keyframes/player";

export class BeginPlayerAnimation extends BaseRpcPacket {
  constructor(
    public keyframes: PlayerAnimationKeyframe[],
    public reset: boolean,
  ) {
    super(0x93);
  }

  static deserialize(reader: MessageReader): BeginPlayerAnimation {
    const keyframes: PlayerAnimationKeyframe[] = [];

    while (reader.getCursor() < reader.getLength() - 1) {
      keyframes.push(PlayerAnimationKeyframe.deserialize(reader.readMessage()!));
    }

    return new BeginPlayerAnimation(keyframes, reader.readBoolean());
  }

  serialize(writer: MessageWriter): void {
    for (let i = 0; i < this.keyframes.length; i++) {
      this.keyframes[i].serialize(writer);
    }

    writer.writeBoolean(this.reset);
  }

  clone(): BeginPlayerAnimation {
    return new BeginPlayerAnimation(this.keyframes.map(c => c.clone()), this.reset);
  }
}
