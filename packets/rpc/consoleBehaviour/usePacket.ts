import { MessageReader, MessageWriter } from "../../../../../../lib/util/hazelMessage";
import { BaseRpcPacket } from "../../../../../../lib/protocol/packets/rpc";

export class UsePacket extends BaseRpcPacket {
  constructor() {
    super(0x84);
  }

  static deserialize(_reader: MessageReader): UsePacket {
    return new UsePacket();
  }

  serialize(): MessageWriter {
    return new MessageWriter();
  }

  clone(): UsePacket {
    return new UsePacket();
  }
}
