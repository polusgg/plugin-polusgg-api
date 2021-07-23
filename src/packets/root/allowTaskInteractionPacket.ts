import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";

export class AllowTaskInteractionPacket extends BaseRootPacket {
  constructor(
    public taskInteractionAllowed: boolean
  ) {
    super(0x8D);
  }
  static deserialize(reader: MessageReader): AllowTaskInteractionPacket {
    return new AllowTaskInteractionPacket(
      reader.readBoolean()
    );
  }

  serialize(writer: MessageWriter): void {
    writer.writeBoolean(this.taskInteractionAllowed);
  }

  clone(): AllowTaskInteractionPacket {
    return new AllowTaskInteractionPacket(this.taskInteractionAllowed);
  }
}