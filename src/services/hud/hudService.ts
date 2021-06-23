import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { Player } from "@nodepolus/framework/src/player";
import { Server } from "@nodepolus/framework/src/server";
import { SetStringPacket } from "../../packets/root";
import { DisplaySystemAlertPacket } from "../../packets/root/displaySystemAlert";
import { SetHudVisibilityPacket } from "../../packets/root/setHudVisibilityPacket";
import { Location } from "../../types/enums";
import { HudItem } from "../../types/enums/hudItem";

declare const server: Server;

export class HudService {
  async displayNotification(notification: string): Promise<void> {
    await Promise.allSettled([...server.getConnections().values()].map(async connection => connection.writeReliable(new DisplaySystemAlertPacket(notification))));
  }

  async setHudString(player: PlayerInstance, location: Location, text: string): Promise<void> {
    await (player as Player).getConnection()?.writeReliable(new SetStringPacket(text, location));
  }

  async setHudVisibility(player: PlayerInstance, item: HudItem, enabled: boolean): Promise<void> {
    await (player as Player).getConnection()?.writeReliable(new SetHudVisibilityPacket(item, enabled));
  }
}
