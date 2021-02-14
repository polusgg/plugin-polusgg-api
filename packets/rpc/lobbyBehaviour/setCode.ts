import { MessageReader, MessageWriter } from "../../../../../../lib/util/hazelMessage";
import { BaseRpcPacket } from "../../../../../../lib/protocol/packets/rpc";

export class SetCodePacket extends BaseRpcPacket {
  constructor(
    public readonly code: string,
  ) {
    super(0x8b);
  }

  static deserialize(reader: MessageReader): SetCodePacket {
    return new SetCodePacket(reader.readString());
  }

  serialize(): MessageWriter {
    return new MessageWriter().writeString(this.code);
  }
}
