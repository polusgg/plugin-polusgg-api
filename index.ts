import { RootPacket } from "@nodepolus/framework/src/protocol/packets/hazel";
import { BasePlugin } from "@nodepolus/framework/src/api/plugin";
import { ResizePacket } from "./packets/root";

RootPacket.registerPacket(0x81, ResizePacket.deserialize, (connection, packet) => {
  connection.setMeta({
    displaySize: {
      width: packet.width,
      height: packet.height,
    },
  });
});

export default class extends BasePlugin {
  constructor() {
    super({
      name: "Polus.gg API",
      version: [1, 0, 0],
    });
  }
}
