import { MessageReader, MessageWriter } from "../../../../../../lib/util/hazelMessage";
import { BaseRpcPacket } from "../../../../../../lib/protocol/packets/rpc";

export class PlaySoundPacket extends BaseRpcPacket {
  constructor(
    public resourceId: number,
    public pitch: number,
    public volume: number,
  ) {
    super(0x85);
  }

  static deserialize(reader: MessageReader): PlaySoundPacket {
    return new PlaySoundPacket(
      reader.readPackedUInt32(),
      reader.readFloat32(),
      reader.readByte(),
    );
  }

  serialize(writer: MessageWriter): void {
    writer.writePackedUInt32(this.resourceId);
    writer.writeFloat32(this.pitch);
    writer.writeByte(this.volume);
  }

  clone(): PlaySoundPacket {
    return new PlaySoundPacket(this.resourceId, this.pitch, this.volume);
  }
}
