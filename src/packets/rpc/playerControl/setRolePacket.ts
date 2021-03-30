import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRpcPacket } from "@nodepolus/framework/src/protocol/packets/rpc";

export class SetRolePacket extends BaseRpcPacket {
  constructor(
    public roleId: number,
  ) {
    super(0x82);
  }

  static deserialize(reader: MessageReader): SetRolePacket {
    return new SetRolePacket(reader.readByte());
  }

  serialize(writer: MessageWriter): void {
    writer.writeByte(this.roleId);
  }

  clone(): SetRolePacket {
    return new SetRolePacket(this.roleId);
  }
}
