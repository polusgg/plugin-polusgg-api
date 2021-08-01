import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";

export class ModstampSetStringPacket extends BaseRootPacket {
  constructor(
    public readonly color: [number, number, number, number],
    public readonly text: string,
  ) {
    super(0x81);
  }

  static deserialize(reader: MessageReader): ModstampSetStringPacket {
    return new ModstampSetStringPacket(
      [...reader.readBytes(4).getBuffer()] as [number, number, number, number],
      reader.readString(),
    );
  }

  serialize(writer: MessageWriter): void {
    writer
      .writeBytes(this.color)
      .writeString(this.text);
  }

  clone(): ModstampSetStringPacket {
    return new ModstampSetStringPacket(this.color, this.text);
  }
}
