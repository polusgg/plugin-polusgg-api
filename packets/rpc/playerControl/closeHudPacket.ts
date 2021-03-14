import { MessageReader, MessageWriter } from "../../../../../../lib/util/hazelMessage";
import { BaseRpcPacket } from "../../../../../../lib/protocol/packets/rpc";

export class CloseHudPacket extends BaseRpcPacket {
  constructor() {
    super(0x89);
  }

  static deserialize(_reader: MessageReader): CloseHudPacket {
    return new CloseHudPacket();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  serialize(_writer: MessageWriter): void {}

  clone(): CloseHudPacket {
    return new CloseHudPacket();
  }
}
