import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { TextComponent } from "@nodepolus/framework/src/api/text";
import { Player } from "@nodepolus/framework/src/player";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { RpcPacket } from "@nodepolus/framework/src/protocol/packets/gameData";
import { GameDataPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { SetNamePacket } from "@nodepolus/framework/src/protocol/packets/rpc";
import { Server } from "@nodepolus/framework/src/server";

export enum NameServicePriority {
  Lowest = 0,
  Lower = 100,
  Low = 200,
  Normal = 300,
  High = 400,
  Higher = 500,
  Highest = 600,
  Top = 700,
}

declare const server: Server;

export class NameService {
  protected nameMap: Map<Connection, Map<PlayerInstance, { name: string; priority: NameServicePriority }[]>> = new Map();

  constructor() {
    server.on("connection.opened", event => {
      this.nameMap.set(event.getConnection(), new Map());
    });

    server.on("connection.closed", event => {
      this.nameMap.delete(event.getConnection());
    });

    server.on("game.ended", event => {
      event.getGame()
        .getLobby()
        .getConnections()
        .forEach(connection => {
          this.nameMap.set(connection, new Map());
        });
    });

    server.on("player.joined", event => {
      this.setForBatch(event.getLobby().getConnections(), event.getPlayer(), event.getPlayer().getName(), NameServicePriority.Lowest);
    });
  }

  async setFor(connection: Connection, player: PlayerInstance, name: string | TextComponent, priority: NameServicePriority = NameServicePriority.Normal): Promise<void> {
    this.setForNoUpdate(connection, player, name.toString(), priority);

    await Promise.allSettled(player.getLobby().getConnections().map(async otherConnection => {
      // get otherConnection's understanding of this player's name
      const nameUnderstanding = this.getFor(otherConnection, player);

      // update the player's name
      return otherConnection.writeReliable(new GameDataPacket([
        new RpcPacket((player as Player).getEntity().getPlayerControl().getNetId(), new SetNamePacket(nameUnderstanding)),
      ], player.getLobby().getCode()));
    }));
  }

  setForBatch(connections: Connection[], player: PlayerInstance, name: string | TextComponent, priority: NameServicePriority = NameServicePriority.Normal): void {
    for (let i = 0; i < connections.length; i++) {
      this.setForNoUpdate(connections[i], player, name.toString(), priority);
    }
  }

  getAllFor(connection: Connection, player: PlayerInstance): { name: string; priority: NameServicePriority }[] {
    return this.nameMap.get(connection)!.get(player)!;
  }

  getFor(connection: Connection, player: PlayerInstance): string {
    return this.getAllFor(connection, player).sort((a1, a2) => a2.priority - a1.priority)[0].name;
  }

  private setForNoUpdate(connection: Connection, player: PlayerInstance, name: string, priority: NameServicePriority): void {
    this.nameMap.get(connection)!.get(player)!.push({ name, priority });
  }
}
