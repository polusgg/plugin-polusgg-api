import { BaseRpcPacket } from "@nodepolus/framework/src/protocol/packets/rpc";
import { Bitfield } from "@nodepolus/framework/src/types";
import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { PlayerAnimationKeyframe } from "../../../services/animation/keyframes/player";

export class BeginPlayerAnimation extends BaseRpcPacket {
  constructor(
    public enableBits: [boolean] | boolean[],
    public keyframes: PlayerAnimationKeyframe[],
    public reset: boolean,
  ) {
    super(0x8c);
  }

  static deserialize(reader: MessageReader): BeginPlayerAnimation {
    const bitfield = Bitfield.fromNumber(reader.readUInt16(), 10);
    const keyframes: PlayerAnimationKeyframe[] = [];

    while (reader.getCursor() < reader.getLength() - 1) {
      keyframes.push(PlayerAnimationKeyframe.deserialize(reader.readMessage()!, bitfield));
    }

    return new BeginPlayerAnimation(bitfield.getBits(), keyframes, reader.readBoolean());
  }

  serialize(writer: MessageWriter): void {
    const bitfield = new Bitfield(this.enableBits);

    writer.writeUInt16(bitfield.toNumber());

    for (let i = 0; i < this.keyframes.length; i++) {
      writer.startMessage();
      this.keyframes[i].serialize(writer, bitfield);
      writer.endMessage();
    }

    writer.writeBoolean(this.reset);
  }

  clone(): BeginPlayerAnimation {
    return new BeginPlayerAnimation(this.enableBits.map(x => x), this.keyframes.map(c => c.clone()), this.reset);
  }
}
