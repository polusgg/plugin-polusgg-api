import { MessageReader, MessageWriter } from "../../../../../../lib/util/hazelMessage";
import { BaseRpcPacket } from "../../../../../../lib/protocol/packets/rpc";

export class SetCodePacket extends BaseRpcPacket {
  constructor(
    public code: string,
  ) {
    super(0x8b);
  }

  static deserialize(reader: MessageReader): SetCodePacket {
    return new SetCodePacket(reader.readString());
  }

  serialize(writer: MessageWriter): void {
    writer.writeString(this.code);
  }

  clone(): SetCodePacket {
    return new SetCodePacket(this.code);
  }
}
