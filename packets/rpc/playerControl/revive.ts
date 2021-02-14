import { MessageReader, MessageWriter } from "../../../../../../lib/util/hazelMessage";
import { BaseRpcPacket } from "../../../../../../lib/protocol/packets/rpc";

export class RevivePacket extends BaseRpcPacket {
  constructor() {
    super(0x8a);
  }

  static deserialize(_reader: MessageReader): RevivePacket {
    return new RevivePacket();
  }

  serialize(): MessageWriter {
    return new MessageWriter();
  }
}
