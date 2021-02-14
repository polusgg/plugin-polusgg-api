import { CustomRootPacketType } from "./packets/root";
import { RootPacket } from "../../../lib/protocol/packets/hazel";
import { ResizePacket } from "./packets/root/resize";
import { BasePlugin } from "../../../lib/api/plugin";
import { Server } from "../../../lib/server";
import { Button } from "./entities/button";
import { Vector2 } from "../../../lib/types";

declare const server: Server;

RootPacket.registerPacket(0x80, ResizePacket.deserialize);

export default class extends BasePlugin {
  constructor() {
    super(server, {
      name: "Polus.gg API",
      version: [1, 0, 0],
    });

    server.on("server.packet.custom", event => {
      const packet = event.getPacket();
      const connection = event.getConnection();

      switch (packet.type as number) {
        case CustomRootPacketType.Resize:
          connection.setMeta({
            displaySize: {
              width: (packet as ResizePacket).width,
              height: (packet as ResizePacket).height,
            },
          });
          break;
        default:
          throw new Error(`Unknown custom root packet type ${packet.type}`);
      }
    });
  }
}
