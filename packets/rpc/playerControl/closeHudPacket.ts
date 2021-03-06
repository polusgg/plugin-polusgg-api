import { MessageReader, MessageWriter } from "../../../../../../lib/util/hazelMessage";
import { BaseRpcPacket } from "../../../../../../lib/protocol/packets/rpc";

export class CloseHudPacket extends BaseRpcPacket {
  constructor() {
    super(0x89);
  }

  static deserialize(_reader: MessageReader): CloseHudPacket {
    return new CloseHudPacket();
  }

  serialize(): MessageWriter {
    return new MessageWriter();
  }

  clone(): CloseHudPacket {
    return new CloseHudPacket();
  }
}
