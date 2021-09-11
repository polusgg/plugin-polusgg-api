import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { Player } from "@nodepolus/framework/src/player";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { RpcPacket } from "@nodepolus/framework/src/protocol/packets/gameData";
import { GameDataPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { SetNamePacket } from "@nodepolus/framework/src/protocol/packets/rpc";
import { Server } from "@nodepolus/framework/src/server";

declare const server: Server;

export class NameService {
  constructor() {
    server.on("connection.opened", event => {
      event.getConnection().setMeta("pggapi.names", new Map());
    });

    server.on("player.name.updated", event => {
      event.doSendResponse(false);
      event.cancel();
    });
  }

  async setFor(connections: Connection | Connection[], target: PlayerInstance, name: string): Promise<void> {
    await Promise.all((Array.isArray(connections) ? connections : [connections]).map(async connection => {
      if (this.getFor(connection, target) == name) {
        return;
      }

      if (!connection.hasMeta("pggapi.names")) {
        connection.setMeta("pggapi.names", new Map());
      }

      connection.getMeta<Map<PlayerInstance, string>>("pggapi.names").set(target, name);

      await connection.writeReliable(new GameDataPacket([
        new RpcPacket((target as Player).getEntity().getPlayerControl().getNetId(), new SetNamePacket(name)),
      ], connection.getSafeLobby().getCode()));
    }));
  }

  async set(target: PlayerInstance, name: string): Promise<void> {
    const playerControl = (target as Player).getEntity().getPlayerControl();

    target.getLobby().getSafeGameData().getGameData()
      .getSafePlayer(target.getId())
      .setName(name);

    await playerControl.sendRpcPacket(new SetNamePacket(name), target.getLobby().getConnections());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (target as any as { name: string }).name = name;

    target.getLobby().getConnections().forEach(connection => {
      if (this.getFor(connection, target) == name) {
        return;
      }

      connection.getMeta<Map<PlayerInstance, string>>("pggapi.names").set(target, name);
    });
  }

  getFor(connection: Connection, target: PlayerInstance): string {
    return connection.getMeta<Map<PlayerInstance, string> | undefined>("pggapi.names")?.get(target) ?? target.getName().toString();
  }
}
