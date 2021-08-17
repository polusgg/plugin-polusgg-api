import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";

export type DiscordPresence = BaseDiscordPresence | PartyDiscordPresence;

export type BaseDiscordPresence = {
  state?: string;
  details?: string;
  startTime?: bigint;
  endTime?: bigint;
  largeImage?: string;
  largeText?: string;
  smallImage?: string;
  smallText?: string;
  partyId?: string;
  matchSecret?: string;
  spectateSecret?: string;
  join?: string;
  partySize?: undefined;
  partyMaxSize?: undefined;
};

export type PartyDiscordPresence = {
  state?: string;
  details?: string;
  startTime?: bigint;
  endTime?: bigint;
  largeImage?: string;
  largeText?: string;
  smallImage?: string;
  smallText?: string;
  partyId?: string;
  matchSecret?: string;
  spectateSecret?: string;
  join?: string;
  partySize: number;
  partyMaxSize: number;
};

export class UpdateRichPresence extends BaseRootPacket {
  constructor(
    public presence: DiscordPresence,
  ) {
    super(0xFB);
  }

  static deserialize(reader: MessageReader): UpdateRichPresence {
    const o: DiscordPresence = {};

    if (reader.readBoolean()) {
      o.state = reader.readString();
    }

    if (reader.readBoolean()) {
      o.details = reader.readString();
    }

    if (reader.readBoolean()) {
      o.startTime = reader.readUInt64();
    }

    if (reader.readBoolean()) {
      o.endTime = reader.readUInt64();
    }

    if (reader.readBoolean()) {
      o.largeImage = reader.readString();
    }

    if (reader.readBoolean()) {
      o.largeText = reader.readString();
    }

    if (reader.readBoolean()) {
      o.smallImage = reader.readString();
    }

    if (reader.readBoolean()) {
      o.smallText = reader.readString();
    }

    if (reader.readBoolean()) {
      o.partyId = reader.readString();
    }

    if (reader.readBoolean()) {
      (o as any as PartyDiscordPresence).partySize = reader.readInt32();
      (o as any as PartyDiscordPresence).partyMaxSize = reader.readInt32();
    }

    if (reader.readBoolean()) {
      o.matchSecret = reader.readString();
    }

    if (reader.readBoolean()) {
      o.spectateSecret = reader.readString();
    }

    if (reader.readBoolean()) {
      o.join = reader.readString();
    }

    return new UpdateRichPresence(o);
  }

  serialize(writer: MessageWriter): MessageWriter {
    writer.writeBoolean(this.presence.state !== undefined);

    if (this.presence.state !== undefined) {
      writer.writeString(this.presence.state);
    }

    writer.writeBoolean(this.presence.details !== undefined);

    if (this.presence.details !== undefined) {
      writer.writeString(this.presence.details);
    }

    writer.writeBoolean(this.presence.startTime !== undefined);

    if (this.presence.startTime !== undefined) {
      writer.writeUInt64(this.presence.startTime);
    }

    writer.writeBoolean(this.presence.endTime !== undefined);

    if (this.presence.endTime !== undefined) {
      writer.writeUInt64(this.presence.endTime);
    }

    writer.writeBoolean(this.presence.largeImage !== undefined);

    if (this.presence.largeImage !== undefined) {
      writer.writeString(this.presence.largeImage);
    }

    writer.writeBoolean(this.presence.largeText !== undefined);

    if (this.presence.largeText !== undefined) {
      writer.writeString(this.presence.largeText);
    }

    writer.writeBoolean(this.presence.smallImage !== undefined);

    if (this.presence.smallImage !== undefined) {
      writer.writeString(this.presence.smallImage);
    }

    writer.writeBoolean(this.presence.smallText !== undefined);

    if (this.presence.smallText !== undefined) {
      writer.writeString(this.presence.smallText);
    }

    writer.writeBoolean(this.presence.partyId !== undefined);

    if (this.presence.partyId !== undefined) {
      writer.writeString(this.presence.partyId);
    }

    writer.writeBoolean(this.presence.partySize !== undefined);

    if (this.presence.partySize !== undefined) {
      writer.writeInt32(this.presence.partySize);
      writer.writeInt32(this.presence.partyMaxSize);
    }

    writer.writeBoolean(this.presence.matchSecret !== undefined);

    if (this.presence.matchSecret !== undefined) {
      writer.writeString(this.presence.matchSecret);
    }

    writer.writeBoolean(this.presence.spectateSecret !== undefined);

    if (this.presence.spectateSecret !== undefined) {
      writer.writeString(this.presence.spectateSecret);
    }

    writer.writeBoolean(this.presence.join !== undefined);

    if (this.presence.join !== undefined) {
      writer.writeString(this.presence.join);
    }

    return writer;
  }

  clone(): UpdateRichPresence {
    return new UpdateRichPresence({ ...this.presence });
  }
}

