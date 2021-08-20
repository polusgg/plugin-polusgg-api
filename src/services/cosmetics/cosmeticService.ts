import { Player } from "@nodepolus/framework/src/player";
import { Server } from "@nodepolus/framework/src/server";
import { SetPlayerBodyPacket } from "../../packets/rpc/playerControl/setPlayerBody";
import got, { Got } from "got";
import { UserResponseStructure } from "@polusgg/module-polusgg-auth-api/src/types/userResponseStructure";
import { Item } from "@polusgg/module-cosmetics/src/types";
import { AssetBundle } from "../../assets";
import { ServiceType } from "../../types/enums";
import { Services } from "../services";
import { ResourceResponse } from "../../types";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { ServerLobbyJoinEvent } from "@nodepolus/framework/src/api/events/server";
import { DisconnectReason } from "@nodepolus/framework/src/types";
import { PlayerJoinedEvent } from "@nodepolus/framework/src/api/events/player";
import { GameDataPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { RpcPacket } from "@nodepolus/framework/src/protocol/packets/gameData";
import { SetHatPacket, SetPetPacket } from "@nodepolus/framework/src/protocol/packets/rpc";
import { LoadHatPacket } from "../../packets/root/loadHatPacket";
import { LoadPetPacket } from "../../packets/root/loadPetPacket";

declare const server: Server;

export class CosmeticService {
  private readonly fetchCosmetic: Got;

  constructor() {
    this.fetchCosmetic = got.extend({ prefixUrl: "http://cosmetics.service.polus.gg:2219/v1/" });

    // this.cacheBundles();

    server.on("server.lobby.join", this.handlePlayerJoining.bind(this));
    server.on("player.joined", this.handlePlayerJoin.bind(this));

    server.on("player.hat.updated", event => {
      if (event.getNewHat() < 10_000_000) {
        return;
      }

      const newHat = event.getPlayer().getLobby().getMeta<Item[] | undefined>("pgg.cosmetic.items")
        ?.find(i => i.amongUsId === event.getNewHat());

      if (newHat === undefined) {
        const connection = event.getPlayer().getConnection();

        if (event.getPlayer().getLobby().hasMeta("pgg.cosmetic.items")) {
          event.cancel();

          if (connection !== undefined) {
            Services.get(ServiceType.Hud).displayNotification(`You attempted to apply a hat you don't own.`, [connection]);
          }
        }
      }
    });

    server.on("player.pet.updated", async event => {
      console.log("Client requested pet", event.getPlayer().getName(), event.getNewPet());

      if (event.getNewPet() < 10_000_000) {
        if (event.getNewPet() as number === 9_999_999) {
          event.setNewPet(event.getPlayer().getSafeConnection().getMeta<UserResponseStructure>("pgg.auth.self").cosmetics?.PET ?? 0);
        }

        return;
      }

      const connection = event.getPlayer().getConnection();

      if (connection === undefined) {
        return;
      }

      const ownedItems = connection.getMeta<Item[] | undefined>("pgg.cosmetic.owned") ?? [];
      const item = ownedItems.find(i => i.amongUsId === event.getNewPet());

      if (item === undefined) {
        // TODO: Ban

        Services.get(ServiceType.Hud).displayNotification("You attempted to equip a pet you don't own", [connection]);

        return;
      }

      // set the cosmetic
      const cosmetic = await AssetBundle.load(item.resource.path, item.resource.url);

      Promise.all([...(event.getPlayer().getLobby().getConnections()
        .filter(c => c !== connection)
        .map(async c => {
          await this.loadCosmeticForConnection(c, [cosmetic], [item], false);
          c.sendReliable([new GameDataPacket([new RpcPacket((event.getPlayer() as Player).getEntity().getPlayerControl().getNetId(), new SetPetPacket(item.amongUsId))], event.getPlayer().getLobby().getCode())]);
        })),
      connection.sendReliable([new GameDataPacket([new RpcPacket((event.getPlayer() as Player).getEntity().getPlayerControl().getNetId(), new SetPetPacket(item.amongUsId))], event.getPlayer().getLobby().getCode())])]);
    });

    server.on("player.hat.updated", async event => {
      console.log("Client requested hat", event.getPlayer().getName(), event.getNewHat());

      if (event.getNewHat() < 10_000_000) {
        if (event.getNewHat() as number === 9_999_999) {
          event.setNewHat(event.getPlayer().getSafeConnection().getMeta<UserResponseStructure>("pgg.auth.self").cosmetics?.HAT ?? 0);
        }

        return;
      }

      const connection = event.getPlayer().getConnection();

      if (connection === undefined) {
        return;
      }

      const ownedItems = connection.getMeta<Item[] | undefined>("pgg.cosmetic.owned") ?? [];
      const item = ownedItems.find(i => i.amongUsId === event.getNewHat());

      if (item === undefined) {
        // TODO: Ban

        Services.get(ServiceType.Hud).displayNotification("You attempted to equip a hat you don't own", [connection]);

        return;
      }

      // set the cosmetic
      const cosmetic = await AssetBundle.load(item.resource.path, item.resource.url);

      Promise.all([...event.getPlayer().getLobby().getConnections()
        .filter(c => c !== connection)
        .map(async c => {
          await this.loadCosmeticForConnection(c, [cosmetic], [item], false);
          c.sendReliable([new GameDataPacket([new RpcPacket((event.getPlayer() as Player).getEntity().getPlayerControl().getNetId(), new SetHatPacket(item.amongUsId))], event.getPlayer().getLobby().getCode())]);
        }),
      connection.sendReliable([new GameDataPacket([new RpcPacket((event.getPlayer() as Player).getEntity().getPlayerControl().getNetId(), new SetHatPacket(item.amongUsId))], event.getPlayer().getLobby().getCode())])]);
    });
  }

  authToken(user: UserResponseStructure): string {
    return `${user.client_token}:${user.client_id}`;
  }

  async setBody(player: Player, body: number): Promise<void> {
    await player.getEntity().getPlayerControl().sendRpcPacket(new SetPlayerBodyPacket(body), player.getLobby().getConnections());
  }

  private async loadCosmeticForConnection(connection: Connection, cosmetics: AssetBundle[], items: Item[], accessible: boolean): Promise<ResourceResponse[]> {
    return Promise.all(cosmetics.map(async (cosmetic, index): Promise<ResourceResponse> => {
      const preloaded = connection.getMeta<[Item, boolean][]>("pgg.cosmetic.loaded").find(i => i[0].amongUsId === cosmetic.getId());

      if (preloaded !== undefined) {
        if (!preloaded[1] && accessible) {
          await connection.writeReliable(new (preloaded[0].type === "HAT" ? LoadHatPacket : LoadPetPacket)(preloaded[0].amongUsId, preloaded[0].resource.id, accessible));
        }

        return {
          isCached: true,
          resourceId: cosmetic.getId(),
        };
      }

      const res = await Services.get(ServiceType.Resource).load(connection, cosmetic);
      const item = items[index];

      connection.getMeta<[Item, boolean][]>("pgg.cosmetic.loaded").push([item, accessible]);
      await connection.writeReliable(new (item.type === "HAT" ? LoadHatPacket : LoadPetPacket)(item.amongUsId, item.resource.id, accessible));

      return res;
    }));
  }

  private async handlePlayerJoining(event: ServerLobbyJoinEvent): Promise<void> {
    const lobby = event.getLobby();

    if (lobby === undefined) {
      return;
    }

    const userResponseStructure = event.getConnection().getMeta<UserResponseStructure | undefined>("pgg.auth.self");

    if (userResponseStructure === undefined) {
      event.setDisconnectReason(DisconnectReason.custom("Error. Failed to join server. Code 1123"));
      event.cancel();

      return;
    }

    console.log("URS.c", userResponseStructure.cosmetics);
    event.getConnection().setMeta("pgg.cosmetic.loaded", []);

    const response = await this.fetchCosmetic.get("item/", { headers: { authorization: this.authToken(userResponseStructure) } });
    const items: Item[] = JSON.parse(response.body).data;

    event.getConnection().setMeta("pgg.cosmetic.owned", items);

    if (userResponseStructure.cosmetics === null) {
      return;
    }

    const cosmeticIds = Object.values(userResponseStructure.cosmetics) as number[];
    const itemsToLoad = items.filter(i => cosmeticIds.includes(i.amongUsId));
    const bundles = await Promise.all(itemsToLoad.map(async i => await AssetBundle.load(i.resource.path, i.resource.url)));

    await this.loadCosmeticForConnection(event.getConnection(), bundles, itemsToLoad, true);

    const players = lobby.getPlayers();

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const connection = player.getConnection();

      if (connection === undefined) {
        continue;
      }

      const ownedCosmetics = connection.getMeta<Item[] | undefined>("pgg.cosmetic.owned") ?? [];

      try {
        const hat = ownedCosmetics.find(c => c.amongUsId === player.getHat());
        const pet = ownedCosmetics.find(c => c.amongUsId === player.getPet());

        if (hat) {
          this.loadCosmeticForConnection(event.getConnection(), [await AssetBundle.load(hat.resource.path, hat.resource.url)], [hat], false);
        }

        if (pet) {
          this.loadCosmeticForConnection(event.getConnection(), [await AssetBundle.load(pet.resource.path, pet.resource.url)], [pet], false);
        }
      } catch {}
    }
  }

  private async handlePlayerJoin(event: PlayerJoinedEvent): Promise<void> {
    const connection = event.getPlayer().getConnection();

    if (connection === undefined) {
      return;
    }

    const userResponseStructure = connection.getMeta<UserResponseStructure>("pgg.auth.self");

    if (userResponseStructure.cosmetics !== null) {
      if (userResponseStructure.cosmetics.HAT !== undefined) {
        event.getPlayer().setHat(userResponseStructure.cosmetics.HAT);
      }

      if (userResponseStructure.cosmetics.PET !== undefined) {
        event.getPlayer().setPet(userResponseStructure.cosmetics.PET);
      }

      if (userResponseStructure.cosmetics.SKIN !== undefined) {
        event.getPlayer().setSkin(userResponseStructure.cosmetics.SKIN);
      }

      if (userResponseStructure.cosmetics.COLOR !== undefined) {
        let requestedColor = userResponseStructure.cosmetics.COLOR;

        // eslint-disable-next-line @typescript-eslint/no-loop-func
        while (event.getLobby().getPlayers().find(p => p.getColor() === requestedColor) !== undefined) {
          requestedColor++;

          if (requestedColor > 18) {
            requestedColor = 0;
          }
        }
      }
    }

    const response = await this.fetchCosmetic.get("item/", { headers: { authorization: this.authToken(userResponseStructure) } });
    const items: Item[] = JSON.parse(response.body).data;
    const bundles = await Promise.all(items.map(async i => await AssetBundle.load(i.resource.path, i.resource.url)));

    await this.loadCosmeticForConnection(connection, bundles, items, true);
  }
}
