import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
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
  protected lobbyMap: Map<LobbyInstance, {
    player: PlayerInstance;
    name: string | TextComponent;
    priority: NameServicePriority;
  }[]> = new Map();

  constructor() {
    server.on("connection.opened", event => {
      this.nameMap.set(event.getConnection(), new Map());
    });

    server.on("connection.closed", event => {
      this.nameMap.delete(event.getConnection());
    });

    server.on("server.lobby.created", event => {
      this.lobbyMap.set(event.getLobby(), []);
    });

    server.on("game.ended", event => {
      if (event.isCancelled()) {
        event.getGame()
          .getLobby()
          .getConnections()
          .forEach(connection => {
            this.nameMap.set(connection, new Map());
          });
      }
    });

    server.on("player.name.updated", async event => {
      event.cancel(true);

      // Override it with our custom name setup
      await Promise.allSettled(event.getPlayer().getLobby().getConnections()
        .map(async otherConnection => {
        // get otherConnection's understanding of this player's name
          const nameUnderstanding = this.getFor(otherConnection, event.getPlayer());

          // update the player's name
          return otherConnection.sendReliable([new GameDataPacket([
            new RpcPacket((event.getPlayer() as Player).getEntity().getPlayerControl().getNetId(), new SetNamePacket(nameUnderstanding)),
          ], event.getPlayer().getLobby().getCode())]);
        }));
    });

    server.on("player.joined", evt => {
      if (this.lobbyMap.has(evt.getLobby())) {
        const data = this.lobbyMap.get(evt.getLobby())!;

        for (let i = 0; i < data.length; i++) {
          const el = data[i];

          this.setFor(evt.getPlayer().getSafeConnection(), el.player, el.name, el.priority);
        }
      }
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

  async setForBatch(connections: Connection[], player: PlayerInstance, name: string | TextComponent, priority: NameServicePriority = NameServicePriority.Normal): Promise<void> {
    for (let i = 0; i < connections.length; i++) {
      this.setForNoUpdate(connections[i], player, name.toString(), priority);
    }

    await Promise.allSettled(connections.map(async otherConnection => {
      // get otherConnection's understanding of this player's name
      const nameUnderstanding = this.getFor(otherConnection, player);

      // update the player's name
      return otherConnection.sendReliable([new GameDataPacket([
        new RpcPacket((player as Player).getEntity().getPlayerControl().getNetId(), new SetNamePacket(nameUnderstanding)),
      ], player.getLobby().getCode())]);
    }));
  }

  async removeForBatch(connections: Connection[], player: PlayerInstance, name: string | TextComponent): Promise<void> {
    for (let i = 0; i < connections.length; i++) {
      this.removeForNoUpdate(connections[i], player, name.toString());
    }

    await Promise.allSettled(connections.map(async otherConnection => {
      // get otherConnection's understanding of this player's name
      const nameUnderstanding = this.getFor(otherConnection, player);

      // update the player's name
      return otherConnection.sendReliable([new GameDataPacket([
        new RpcPacket((player as Player).getEntity().getPlayerControl().getNetId(), new SetNamePacket(nameUnderstanding)),
      ], player.getLobby().getCode())]);
    }));
  }

  async setForLobby(player: PlayerInstance, name: string | TextComponent, priority: NameServicePriority = NameServicePriority.Normal): Promise<void> {
    this.lobbyMap.get(player.getLobby())!.push({ player, name, priority });

    await this.setForBatch(player.getLobby().getConnections(), player, name, priority);
  }

  async removeForLobby(player: PlayerInstance, name: string | TextComponent): Promise<void> {
    const idx = this.lobbyMap.get(player.getLobby())!.findIndex(v => v.name === name && v.player === player);

    if (idx === -1) {
      throw new Error("Failed to find lobby string request");
    }

    this.lobbyMap.set(player.getLobby(), this.lobbyMap.get(player.getLobby())!.splice(idx, 1));

    await this.removeForBatch(player.getLobby().getConnections(), player, name);
  }

  getAllFor(connection: Connection, player: PlayerInstance): { name: string; priority: NameServicePriority }[] {
    return this.nameMap.get(connection)?.get(player) ?? [{ name: player.getName().toString(), priority: -10000 }];
  }

  getFor(connection: Connection, player: PlayerInstance): string {
    const r = this.getAllFor(connection, player).sort((a1, a2) => a1.priority - a2.priority);

    return r[r.length - 1].name;
  }

  private setForNoUpdate(connection: Connection, player: PlayerInstance, name: string, priority: NameServicePriority): void {
    if (!this.nameMap.get(connection)!.has(player)) {
      this.nameMap.get(connection)!.set(player, []);
    }

    this.nameMap.get(connection)!.get(player)!.push({ name, priority });
  }

  private removeForNoUpdate(connection: Connection, player: PlayerInstance, name: string): void {
    if (!this.nameMap.get(connection)!.has(player)) {
      return;
    }

    const index = this.nameMap.get(connection)!.get(player)!.findIndex(v => v.name === name);

    if (index === -1) {
      throw new Error("Could not find name request to remove");
    }

    this.nameMap.get(connection)!.set(player, this.nameMap.get(connection)!.get(player)!.splice(index, 1));
  }
}
