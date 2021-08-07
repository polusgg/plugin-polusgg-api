import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";

export class LoadHatPacket extends BaseRootPacket {
  constructor(
    public readonly hatId: number,
    public readonly resourceId: number,
    public readonly accessible: boolean,
  ) {
    super(0x96);
  }

  static deserialize(reader: MessageReader): LoadHatPacket {
    return new LoadHatPacket(reader.readPackedUInt32(), reader.readPackedUInt32(), reader.readBoolean());
  }

  serialize(writer: MessageWriter): void {
    writer
      .writePackedUInt32(this.hatId)
      .writePackedUInt32(this.resourceId)
      .writeBoolean(this.accessible);
  }

  clone(): LoadHatPacket {
    return new LoadHatPacket(this.hatId, this.resourceId, this.accessible);
  }
}
