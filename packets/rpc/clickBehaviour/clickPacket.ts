import { MessageReader, MessageWriter } from "../../../../../../lib/util/hazelMessage";
import { BaseRpcPacket } from "../../../../../../lib/protocol/packets/rpc";

export class ClickPacket extends BaseRpcPacket {
  constructor() {
    super(0x84);
  }

  static deserialize(reader: MessageReader): ClickPacket {
    return new ClickPacket();
  }

  serialize(): MessageWriter {
    return new MessageWriter();
  }

  clone(): ClickPacket {
    return new ClickPacket();
  }
}
