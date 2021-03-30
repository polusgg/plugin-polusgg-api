import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { Location } from "../../types/enums";

export class SetStringPacket extends BaseRootPacket {
  constructor(
    public content: string,
    public location: Location,
  ) {
    super(0x84);
  }

  static deserialize(reader: MessageReader): SetStringPacket {
    return new SetStringPacket(reader.readString(), reader.readByte());
  }

  serialize(): MessageWriter {
    return new MessageWriter().writeString(this.content).writeByte(this.location);
  }

  clone(): SetStringPacket {
    return new SetStringPacket(this.content, this.location);
  }
}
