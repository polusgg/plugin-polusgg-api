import { MessageReader, MessageWriter } from "../../../../../../lib/util/hazelMessage";
import { BaseRpcPacket } from "../../../../../../lib/protocol/packets/rpc";

export class PlaySoundPacket extends BaseRpcPacket {
  constructor(
    public readonly resourceId: number,
    public readonly pitch: number,
    public readonly volume: number,
  ) {
    super(0x8c);
  }

  static deserialize(reader: MessageReader): PlaySoundPacket {
    return new PlaySoundPacket(
      reader.readPackedUInt32(),
      reader.readFloat32(),
      reader.readByte(),
    );
  }

  serialize(): MessageWriter {
    return new MessageWriter()
      .writePackedUInt32(this.resourceId)
      .writeFloat32(this.pitch)
      .writeByte(this.volume);
  }

  clone(): PlaySoundPacket {
    return new PlaySoundPacket(this.resourceId, this.pitch, this.volume);
  }
}
