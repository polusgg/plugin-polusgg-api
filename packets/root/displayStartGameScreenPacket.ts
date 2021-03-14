import { MessageReader, MessageWriter } from "../../../../../lib/util/hazelMessage";
import { BaseRootPacket } from "../../../../../lib/protocol/packets/root";

export class DisplayStartGameScreenPacket extends BaseRootPacket {
  constructor(
    public readonly titleText: string,
    public readonly subtitleText: string,
    public readonly backgroundColor: [number, number, number, number],
    public readonly yourTeam: number[],
  ) {
    super(0x80);
  }

  static deserialize(reader: MessageReader): DisplayStartGameScreenPacket {
    return new DisplayStartGameScreenPacket(
      reader.readString(),
      reader.readString(),
      [...reader.readBytes(4).getBuffer()] as [number, number, number, number],
      [...reader.readRemainingBytes().getBuffer()],
    );
  }

  serialize(writer: MessageWriter): void {
    writer
      .writeString(this.titleText)
      .writeString(this.subtitleText)
      .writeBytes(this.backgroundColor)
      .writeBytes(this.yourTeam);
  }

  clone(): DisplayStartGameScreenPacket {
    return new DisplayStartGameScreenPacket(
      this.titleText,
      this.subtitleText,
      [...this.backgroundColor],
      [...this.yourTeam],
    );
  }
}
