import { MessageReader, MessageWriter } from "../../../../../../lib/util/hazelMessage";
import { BaseRpcPacket } from "../../../../../../lib/protocol/packets/rpc";

export class ChatVisibilityPacket extends BaseRpcPacket {
  constructor(
    public readonly isVisible: boolean,
  ) {
    super(0x8d);
  }

  static deserialize(reader: MessageReader): ChatVisibilityPacket {
    return new ChatVisibilityPacket(reader.readBoolean());
  }

  serialize(): MessageWriter {
    return new MessageWriter().writeBoolean(this.isVisible);
  }

  clone(): ChatVisibilityPacket {
    return new ChatVisibilityPacket(this.isVisible);
  }
}
