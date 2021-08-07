import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";

export class LoadPetPacket extends BaseRootPacket {
  constructor(
    public readonly petId: number,
    public readonly resourceId: number,
    public readonly accessible: boolean,
  ) {
    super(0x97);
  }

  static deserialize(reader: MessageReader): LoadPetPacket {
    return new LoadPetPacket(reader.readPackedUInt32(), reader.readPackedUInt32(), reader.readBoolean());
  }

  serialize(writer: MessageWriter): void {
    writer
      .writePackedUInt32(this.petId)
      .writePackedUInt32(this.resourceId)
      .writeBoolean(this.accessible);
  }

  clone(): LoadPetPacket {
    return new LoadPetPacket(this.petId, this.resourceId, this.accessible);
  }
}
