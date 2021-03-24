import { MessageReader, MessageWriter } from "../../../../../../lib/util/hazelMessage";
import { BaseRpcPacket } from "../../../../../../lib/protocol/packets/rpc";
import { RpcPacketType } from "../../../../../../lib/types/enums";
import { Vector2 } from "../../../../../../lib/types";

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
