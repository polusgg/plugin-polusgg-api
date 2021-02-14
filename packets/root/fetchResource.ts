/* eslint-disable @typescript-eslint/naming-convention */
import { MessageReader, MessageWriter } from "../../../../../lib/util/hazelMessage";
import { BaseRootPacket } from "../../../../../lib/protocol/packets/root";
import { CustomRootPacketType } from ".";

export enum ResourceType {
  "audio/aac",
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "audio/mpeg",
  "video/mpeg",
  "audio/ogg",
  "video/ogg",
  "image/png",
  "image/svg+xml",
  "image/tiff",
  "video/mp2t",
  "audio/wav",
  "audio/webm",
  "image/webp",
  "video/3gpp",
  "video/3gpp2",
  "unity/assetbundlearchive",
}

export enum DownloadFailureReason {
  Todo,
}

export class FetchResourcePacket extends BaseRootPacket {
  constructor(
    public readonly resourceId: number,
    public readonly resourceType: ResourceType,
    public readonly resourceLocation: string,
    public readonly cacheDuration: number,
  ) {
    super(CustomRootPacketType.FetchResource as number);
  }

  static deserialize(reader: MessageReader): FetchResourcePacket {
    return new FetchResourcePacket(
      reader.readPackedUInt32(),
      reader.readPackedUInt32(),
      reader.readString(),
      reader.readPackedUInt32(),
    );
  }

  serialize(): MessageWriter {
    return new MessageWriter()
      .writePackedUInt32(this.resourceId)
      .writePackedUInt32(this.resourceType)
      .writeString(this.resourceLocation)
      .writePackedUInt32(this.cacheDuration);
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
      .writeByte(this.response.type)
      .writeBytes(this.response.serialize());
  }
}
