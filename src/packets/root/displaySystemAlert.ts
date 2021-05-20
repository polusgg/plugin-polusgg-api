import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";

export class DisplaySystemAlertPacket extends BaseRootPacket {
  constructor(
    public content: string,
  ) {
    super(0x84);
  }

  static deserialize(reader: MessageReader): DisplaySystemAlertPacket {
    return new DisplaySystemAlertPacket(reader.readString());
  }

  serialize(): MessageWriter {
    return new MessageWriter().writeString(this.content);
  }

  clone(): DisplaySystemAlertPacket {
    return new DisplaySystemAlertPacket(this.content);
  }
}
