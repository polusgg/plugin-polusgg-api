import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { Player } from "@nodepolus/framework/src/player";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { RpcPacket } from "@nodepolus/framework/src/protocol/packets/gameData";
import { GameDataPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { Server } from "@nodepolus/framework/src/server";
import { GameOverReason } from "@nodepolus/framework/src/types/enums";
import { SetStringPacket } from "../../packets/root";
import { DisplaySystemAlertPacket } from "../../packets/root/displaySystemAlert";
import { SetHudVisibilityPacket } from "../../packets/root/setHudVisibilityPacket";
import { ChatVisibilityPacket } from "../../packets/rpc/gameData";
import { Location } from "../../types/enums";
import { HudItem } from "../../types/enums/hudItem";

declare const server: Server;

export class HudService {
  constructor() {
    server.on("game.ended", game => {
      if (game.getReason() !== 7 as GameOverReason) {
        return;
      }

      game.getGame().getLobby().getPlayers()
        .forEach(player => {
          this.setHudString(player, Location.TaskText, "__unset");
          this.setHudString(player, Location.PingTracker, "__unset");
        });
    });
  }

  async displayNotification(notification: string): Promise<void> {
    await Promise.allSettled([...server.getConnections().values()].map(async connection => connection.writeReliable(new DisplaySystemAlertPacket(notification))));
  }

  async setHudString(player: PlayerInstance, location: Location, text: string): Promise<void> {
    console.trace("Setting HUD string for", player.getId(), player.getName(), Location[location], text)

    await (player as Player).getConnection()?.writeReliable(new SetStringPacket(text, location));
  }

  async setHudVisibility(player: PlayerInstance, item: HudItem, enabled: boolean): Promise<void> {
    await (player as Player).getConnection()?.writeReliable(new SetHudVisibilityPacket(item, enabled));
  }

  async chatVisibility(connection: Connection, visible: boolean): Promise<void> {
    await connection.writeReliable(new GameDataPacket([
      new RpcPacket(
        connection.getLobby()!.getGameData()!.getGameData().getNetId(),
        new ChatVisibilityPacket(visible),
      ),
    ], connection.getLobby()!.getCode()));
  }
}
