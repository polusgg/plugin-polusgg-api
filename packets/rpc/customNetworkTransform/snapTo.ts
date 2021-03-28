import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRpcPacket } from "@nodepolus/framework/src/protocol/packets/rpc";
import { RpcPacketType } from "@nodepolus/framework/src/types/enums";
import { Vector2 } from "@nodepolus/framework/src/types";

/**
 * RPC Packet ID: `0x15` (`21`)
 */
export class SnapToPacket extends BaseRpcPacket {
  constructor(
    public position: Vector2,
  ) {
    super(RpcPacketType.SnapTo);
  }

  static deserialize(reader: MessageReader): SnapToPacket {
    return new SnapToPacket(reader.readVector2());
  }

  clone(): SnapToPacket {
    return new SnapToPacket(this.position.clone());
  }

  serialize(writer: MessageWriter): void {
    writer.writeVector2(this.position);
  }
}
