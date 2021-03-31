import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { Vector2 } from "@nodepolus/framework/src/types";
import { EntityButton } from "../../entities";
import { EdgeAlignments } from "../../types/enums/edgeAlignment";
import Emittery from "emittery";
import { ButtonEvents } from "../../types/buttonEvents";
import { Server } from "@nodepolus/framework/src/server";

// TODO: Update to not suck ass

export class ButtonService extends Emittery<ButtonEvents> {
  public buttonMap: Map<number, EntityButton> = new Map();

  setupService(server: Server): void {
    server.on("server.packet.in.rpc.custom", event => {
      if (event.getPacket().getType() == 0x86) {
        if (this.buttonMap.has(event.getNetId())) {
          this.emit("clicked", this.buttonMap.get(event.getNetId())!);
        }
      }
    });
  }

  createButton(
    connection: Connection,
    resource: number,
    position: Vector2,
    alignment: EdgeAlignments = EdgeAlignments.LeftBottom,
    cooldown: number = 0,
  ): EntityButton {
    const button = new EntityButton(
      connection.getSafeLobby(),
      resource,
      cooldown,
      position,
      alignment,
    );

    this.buttonMap.set(button.getClickBehaviour().getNetId(), button);

    return button;
  }
}
