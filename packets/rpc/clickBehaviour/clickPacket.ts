import { MessageReader, MessageWriter } from "../../../../../../lib/util/hazelMessage";
import { BaseRpcPacket } from "../../../../../../lib/protocol/packets/rpc";

export class ClickPacket extends BaseRpcPacket {
  constructor() {
    super(0x84);
  }

  static deserialize(_reader: MessageReader): ClickPacket {
    return new ClickPacket();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  serialize(_writer: MessageWriter): void {}

  clone(): ClickPacket {
    return new ClickPacket();
  }
}
