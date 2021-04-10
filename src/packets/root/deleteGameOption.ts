import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";

export class DeleteGameOption extends BaseRootPacket {
  constructor(
    public name: string,
  ) {
    super(0x8A);
  }

  static deserialize(reader: MessageReader): DeleteGameOption {
    return new DeleteGameOption(reader.readString());
  }

  serialize(writer: MessageWriter): void {
    writer.writeString(this.name);
  }

  clone(): DeleteGameOption {
    return new DeleteGameOption(this.name);
  }
}
