import { MessageReader, MessageWriter } from "../../../../../../lib/util/hazelMessage";
import { BaseRpcPacket } from "../../../../../../lib/protocol/packets/rpc";
import { Location } from "../../../types/enums";

export class SetCodePacket extends BaseRpcPacket {
  constructor(
    public content: string,
    public location: Location,
  ) {
    super(0x8b);
  }

  static deserialize(reader: MessageReader): SetCodePacket {
    return new SetCodePacket(reader.readString(), reader.readByte());
  }

  serialize(): MessageWriter {
    return new MessageWriter().writeString(this.content).writeByte(this.location);
  }

  clone(): SetCodePacket {
    return new SetCodePacket(this.content, this.location);
  }
}
