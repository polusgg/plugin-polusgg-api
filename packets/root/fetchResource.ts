/* eslint-disable @typescript-eslint/naming-convention */
import { MessageReader, MessageWriter } from "../../../../../lib/util/hazelMessage";
import { BaseRootPacket } from "../../../../../lib/protocol/packets/root";
import { CustomRootPacketType } from ".";

export enum DownloadFailureReason {
  Todo,
}

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
      .writePackedUInt32(this.hash.length)
      .writeBytes(this.hash);
  }

  clone(): FetchResourcePacket {
    return new FetchResourcePacket(this.resourceId, this.resourceLocation, this.hash);
  }
}

export class FetchResourceResponseStartedPacket extends BaseRootPacket {
  constructor(
    public readonly size: number,
  ) {
    super(0x00);
  }

  static deserialize(reader: MessageReader): FetchResourceResponseStartedPacket {
    return new FetchResourceResponseStartedPacket(
      reader.readPackedUInt32(),
    );
  }

  serialize(): MessageWriter {
    return new MessageWriter().writePackedUInt32(this.size);
  }

  clone(): FetchResourceResponseStartedPacket {
    return new FetchResourceResponseStartedPacket(this.size);
  }
}

export class FetchResourceResponseEndedPacket extends BaseRootPacket {
  constructor(
    public readonly didCache: boolean,
  ) {
    super(0x01);
  }

  static deserialize(reader: MessageReader): FetchResourceResponseEndedPacket {
    return new FetchResourceResponseEndedPacket(
      reader.readBoolean(),
    );
  }

  serialize(): MessageWriter {
    return new MessageWriter().writeBoolean(this.didCache);
  }

  clone(): FetchResourceResponseEndedPacket {
    return new FetchResourceResponseEndedPacket(this.didCache);
  }
}

export class FetchResourceResponseFailedPacket extends BaseRootPacket {
  constructor(
    public readonly reason: DownloadFailureReason,
  ) {
    super(0x02);
  }

  static deserialize(reader: MessageReader): FetchResourceResponseFailedPacket {
    return new FetchResourceResponseFailedPacket(
      reader.readPackedUInt32(),
    );
  }

  serialize(): MessageWriter {
    return new MessageWriter().writePackedUInt32(this.reason);
  }

  clone(): FetchResourceResponseFailedPacket {
    return new FetchResourceResponseFailedPacket(this.reason);
  }
}

export class FetchResourceResponsePacket extends BaseRootPacket {
  constructor(
    public readonly resourceId: number,
    public readonly response: FetchResourceResponseStartedPacket | FetchResourceResponseEndedPacket | FetchResourceResponseFailedPacket,
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
