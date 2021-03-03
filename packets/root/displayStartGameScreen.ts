import { MessageReader, MessageWriter } from "../../../../../lib/util/hazelMessage";
import { BaseRootPacket } from "../../../../../lib/protocol/packets/root";

export class DisplayStartGameScreen extends BaseRootPacket {
  constructor(
    public readonly titleText: string,
    public readonly subtitleText: string,
    public readonly backgroundColor: [number, number, number, number],
    public readonly yourTeam: number[],
  ) {
    super(0x80);
  }

  static deserialize(reader: MessageReader): DisplayStartGameScreen {
    return new DisplayStartGameScreen(reader.readString(), reader.readString(), [...reader.readBytes(4).getBuffer()] as [number, number, number, number], [...reader.readRemainingBytes().getBuffer()]);
  }

  serialize(): MessageWriter {
    return new MessageWriter()
      .writeString(this.titleText)
      .writeString(this.subtitleText)
      .writeBytes(this.backgroundColor)
      .writeBytes(this.yourTeam);
  }

  clone(): DisplayStartGameScreen {
    return new DisplayStartGameScreen(this.titleText, this.subtitleText, [...this.backgroundColor], [...this.yourTeam]);
  }
}
