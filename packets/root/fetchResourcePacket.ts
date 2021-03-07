import { MessageReader, MessageWriter } from "../../../../../lib/util/hazelMessage";
import { BaseRootPacket } from "../../../../../lib/protocol/packets/root";
import { CustomRootPacketType } from "../../types/enums";
import {
  BaseResponse,
  FetchResourceResponseEndedPacket,
  FetchResourceResponseFailedPacket,
  FetchResourceResponseStartedPacket,
 } from "./fetchResource";

export class FetchResourcePacket extends BaseRootPacket {
  constructor(
    public readonly resourceId: number,
    public readonly resourceLocation: string,
    public readonly hash: Buffer,
  ) {
    super(CustomRootPacketType.FetchResource as number);
  }

  static deserialize(reader: MessageReader): FetchResourcePacket {
    return new FetchResourcePacket(
      reader.readPackedUInt32(),
      reader.readString(),
      Buffer.from(reader.readBytesAndSize()),
    );
  }

  serialize(): MessageWriter {
    return new MessageWriter()
      .writePackedUInt32(this.resourceId)
      .writeString(this.resourceLocation)
      .writeBytesAndSize(this.hash);
  }

  clone(): FetchResourcePacket {
    return new FetchResourcePacket(
      this.resourceId,
      this.resourceLocation,
      this.hash,
    );
  }
}

export class FetchResourceResponsePacket extends BaseRootPacket {
  constructor(
    public readonly resourceId: number,
    public readonly response: BaseResponse,
  ) {
    super(CustomRootPacketType.FetchResource as number);
  }

  static deserialize(reader: MessageReader): FetchResourceResponsePacket {
    const resourceId = reader.readPackedUInt32();
    const type = reader.readByte();

    switch (type) {
      case 0:
        return new FetchResourceResponsePacket(resourceId, FetchResourceResponseStartedPacket.deserialize(reader));
      case 1:
        return new FetchResourceResponsePacket(resourceId, FetchResourceResponseEndedPacket.deserialize(reader));
      case 2:
        return new FetchResourceResponsePacket(resourceId, FetchResourceResponseFailedPacket.deserialize(reader));
      default:
        throw new Error(`Unknown resource response type: ${type}`);
    }
  }

  serialize(): MessageWriter {
    return new MessageWriter()
      .writePackedUInt32(this.resourceId)
      .writeByte(this.response.getType())
      .writeBytes(this.response.serialize());
  }

  clone(): FetchResourceResponsePacket {
    return new FetchResourceResponsePacket(this.resourceId, this.response.clone());
  }
}
