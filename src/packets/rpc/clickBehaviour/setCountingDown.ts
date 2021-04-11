import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRpcPacket } from "@nodepolus/framework/src/protocol/packets/rpc";

export class SetCountingDown extends BaseRpcPacket {
  constructor(
    public requestCounting: boolean,
    public currentTimer: number,
  ) {
    super(0x90);
  }

  static deserialize(reader: MessageReader): SetCountingDown {
    return new SetCountingDown(
      reader.readBoolean(),
      reader.readFloat32(),
    );
  }

  serialize(writer: MessageWriter): void {
    writer.writeBoolean(this.requestCounting);
    writer.writeFloat32(this.currentTimer);
  }

  clone(): SetCountingDown {
    return new SetCountingDown(this.requestCounting, this.currentTimer);
  }
}
