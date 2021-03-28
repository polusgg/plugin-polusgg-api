import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { DownloadFailureReason } from "../../../types/enums";

export class FetchResourceResponseFailedPacket extends BaseRootPacket {
  constructor(
    public readonly reason: DownloadFailureReason,
  ) {
    super(0x02);
  }

  static deserialize(reader: MessageReader): FetchResourceResponseFailedPacket {
    return new FetchResourceResponseFailedPacket(reader.readPackedUInt32());
  }

  serialize(writer: MessageWriter): void {
    writer.writePackedUInt32(this.reason);
  }

  clone(): FetchResourceResponseFailedPacket {
    return new FetchResourceResponseFailedPacket(this.reason);
  }
}
