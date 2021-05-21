import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRpcPacket } from "@nodepolus/framework/src/protocol/packets/rpc";

export class SetPlayerBodyPacket extends BaseRpcPacket {
  constructor(
    public playerBody: number,
  ) {
    super(0x8a);
  }

  static deserialize(reader: MessageReader): SetPlayerBodyPacket {
    return new SetPlayerBodyPacket(reader.readPackedUInt32());
  }

  serialize(writer: MessageWriter): void {
    writer.writePackedUInt32(this.playerBody);
  }

  clone(): SetPlayerBodyPacket {
    return new SetPlayerBodyPacket(this.playerBody);
  }
}
