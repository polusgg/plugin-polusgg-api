import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";

export class DeleteGameOption extends BaseRootPacket {
  constructor(
    public sequenceId: number,
    public name: string,
  ) {
    super(0x8A);
  }

  static deserialize(reader: MessageReader): DeleteGameOption {
    return new DeleteGameOption(reader.readUInt16(), reader.readString());
  }

  serialize(writer: MessageWriter): void {
    writer.writeUInt16(this.sequenceId);
    writer.writeString(this.name);
  }

  clone(): DeleteGameOption {
    return new DeleteGameOption(this.sequenceId, this.name);
  }
}
