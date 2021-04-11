import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { Server } from "@nodepolus/framework/src/server";
import { LobbyOptions } from "./gameOptionsSet";

declare const server: Server;

export class GameOptionsService {
  constructor() {
    server.on("server.lobby.created", event => {
      event.getLobby().setMeta("pgg.options", new LobbyOptions<Record<string, boolean | number>>(event.getLobby()));
    });
  }

  getGameOptions<T extends Record<string, boolean | number>>(lobby: LobbyInstance): LobbyOptions<T> {
    return lobby.getMeta<LobbyOptions<T>>("pgg.options");
  }
}