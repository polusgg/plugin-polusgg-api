import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { Player } from "@nodepolus/framework/src/player";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { RpcPacket } from "@nodepolus/framework/src/protocol/packets/gameData";
import { GameDataPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { Server } from "@nodepolus/framework/src/server";
import { SetStringPacket } from "../../packets/root";
import { DisplaySystemAlertPacket } from "../../packets/root/displaySystemAlert";
import { SetHudVisibilityPacket } from "../../packets/root/setHudVisibilityPacket";
import { ChatVisibilityPacket } from "../../packets/rpc/gameData";
import { CloseHudPacket } from "../../packets/rpc/playerControl";
import { Location } from "../../types/enums";
import { HudItem } from "../../types/enums/hudItem";
import { ModstampSetStringPacket } from "../../packets/root/modstampSetStringPacket";
import { DisableQR, SetQRContents } from "../../packets/root/setQRContents";
import { MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";

declare const server: Server;

export class HudService {
  /**
   * Warning! This by default brodacasts to the entire node, so change the sendTo parameter if you're not trying to do that.
   */
  async displayNotification(notification: string, sendTo: Connection[] = [...server.getConnections().values()]): Promise<void> {
    await Promise.allSettled(sendTo.map(async connection => connection.writeReliable(new DisplaySystemAlertPacket(notification))));
  }

  async setHudString(player: PlayerInstance, location: Location, text: string): Promise<void> {
    await (player as Player).getConnection()?.writeReliable(new SetStringPacket(text, location));
  }

  async setModString(player: PlayerInstance, color: [number, number, number, number], text: string): Promise<void> {
    await (player as Player).getConnection()?.writeReliable(new ModstampSetStringPacket(color, text));
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

  async closeHud(player: PlayerInstance): Promise<void> {
    await (player as Player).getEntity().getPlayerControl().sendRpcPacket(new CloseHudPacket());
  }

  async updateQrCode(c: Connection, t: { enabled: false } | { enabled: true; contents: string }): Promise<void> {
    if (t.enabled) {
      await c.writeReliable(new SetQRContents(t.contents));
    } else {
      await c.writeReliable(new DisableQR());
    }
  }

  async updateQrCodeState(c: Connection): Promise<void> {
    const writer = new MessageWriter();

    writer.writeBytes(Buffer.from(c.getSafeLobby().getMeta<string>("pgg.log.uuid").split("-")
      .join(""), "hex"));

    writer.writeBytes(Buffer.from(c.getMeta<string>("pgg.log.uuid").split("-")
      .join(""), "hex"));

    if (c.getSafeLobby().getGame()?.hasMeta("pgg.log.uuid")) {
      writer.writeBytes(Buffer.from(c.getSafeLobby().getGame()!.getMeta<string>("pgg.log.uuid").split("-").join(""), "hex"));
    }

    await this.updateQrCode(c, {
      enabled: true,
      contents: writer.getBuffer().toString("base64").split("=")
        .join(""),
    });
  }
}
