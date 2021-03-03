import { MessageReader, MessageWriter } from "../../../../../../lib/util/hazelMessage";
import { BaseRpcPacket } from "../../../../../../lib/protocol/packets/rpc";

export class SetRolePacket extends BaseRpcPacket {
  constructor() {
    super(0x89);
  }

  static deserialize(_reader: MessageReader): SetRolePacket {
    return new SetRolePacket();
  }

  serialize(): MessageWriter {
    return new MessageWriter();
  }

  clone(): SetRolePacket {
    return new SetRolePacket();
  }
}
