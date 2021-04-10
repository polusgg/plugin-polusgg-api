import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";

export class SetGameOption extends BaseRootPacket {
  constructor(
    public name: string,
    public value: boolean | number,
  ) {
    super(0x89);
  }

  static deserialize(reader: MessageReader): SetGameOption {
    return new SetGameOption(reader.readString(), reader.readBoolean() ? reader.readFloat32() : reader.readBoolean());
  }

  serialize(writer: MessageWriter): void {
    writer.writeString(this.name);

    if (typeof this.value === "number") {
      writer.writeFloat32(this.value);
    } else {
      writer.writeBoolean(this.value);
    }
  }

  clone(): SetGameOption {
    return new SetGameOption(this.name, this.value);
  }
}
