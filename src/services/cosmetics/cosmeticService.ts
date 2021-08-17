import { Player } from "@nodepolus/framework/src/player";
import { Server } from "@nodepolus/framework/src/server";
import { SetPlayerBodyPacket } from "../../packets/rpc/playerControl/setPlayerBody";
import got, { Got } from "got";
import { UserResponseStructure } from "@polusgg/module-polusgg-auth-api/src/types/userResponseStructure";
import { PlayerJoinedEvent } from "@nodepolus/framework/src/api/events/player";
import { Item } from "@polusgg/module-cosmetics/src/types";
import { LoadHatPacket } from "../../packets/root/loadHatPacket";
import { LoadPetPacket } from "../../packets/root/loadPetPacket";
import { AssetBundle } from "../../assets";
import { ServiceType } from "../../types/enums";
import { Services } from "../services";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";

declare const server: Server;

export class CosmeticService {
  private readonly fetchCosmetic: Got;

  constructor() {
    this.fetchCosmetic = got.extend({ prefixUrl: "http://cosmetics.service.polus.gg:2219/v1/" });

    server.on("player.joined", event => {
      if (event.getPlayer().getConnection() !== undefined && !event.isRejoining()) {
        this.playerJoined(event);
      }
    });

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

    server.on("player.pet.updated", event => {
      if (event.getNewPet() < 10_000_000) {
        return;
      }

      const newPet = event.getPlayer().getLobby().getMeta<Item[] | undefined>("pgg.cosmetic.items")
        ?.find(i => i.amongUsId === event.getNewPet());

      if (newPet === undefined) {
        const connection = event.getPlayer().getConnection();

        if (event.getPlayer().getLobby().hasMeta("pgg.cosmetic.items")) {
          event.cancel();

          if (connection !== undefined) {
            Services.get(ServiceType.Hud).displayNotification(`You attempted to apply a pet you don't own.`, [connection]);
          }
        }
      }
    });
  }

  loadItem(item: Item, lobby: LobbyInstance): void {
    const resourceService = Services.get(ServiceType.Resource);

    AssetBundle.load(item.resource.path, item.resource.url).then(bundle => {
      switch (item.type) {
        case "HAT": {
          const connections = lobby.getConnections();

          for (let i = 0; i < connections.length; i++) {
            const conn = connections[i];

            resourceService.load(conn, bundle).then(async () => {
              const ownedItems = conn.getMeta<Item[]>("pgg.cosmetics.ownedItems");

              await conn.writeReliable(new LoadHatPacket(
                item.amongUsId,
                item.resource.id,
                ownedItems.some(val => val.amongUsId),
              ));

              const player = conn.getPlayer();

              if (player !== undefined && player.getHat() === item.amongUsId) {
                await player.setHat(item.amongUsId);
              }
            });
          }
          break;
        }
        case "PET": {
          const connections = lobby.getConnections();

          for (let i = 0; i < connections.length; i++) {
            const conn = connections[i];

            resourceService.load(conn, bundle).then(async () => {
              const ownedItems = conn.getMeta<Item[]>("pgg.cosmetics.ownedItems");

              await conn.writeReliable(new LoadPetPacket(
                item.amongUsId,
                item.resource.id,
                ownedItems.some(val => val.amongUsId),
              ));

              const player = conn.getPlayer();

              if (player !== undefined && player.getPet() === item.amongUsId) {
                await player.setPet(item.amongUsId);
              }
            });
          }
          break;
        }
        default:
          throw new Error(`Unsupported item type ${item.type}`);
      }
    });
  }

  authToken(user: UserResponseStructure): string {
    return `${user.client_token}:${user.client_id}`;
  }

  async setBody(player: Player, body: number): Promise<void> {
    await player.getEntity().getPlayerControl().sendRpcPacket(new SetPlayerBodyPacket(body), player.getLobby().getConnections());
  }

  private async playerJoined(event: PlayerJoinedEvent): Promise<void> {
    const lobby = event.getLobby();
    const user = (lobby.getActingHosts()[0] ?? lobby.getCreator()).getMeta<UserResponseStructure>("pgg.auth.self");

    const { body: itemsResponse } = await this.fetchCosmetic("item", {
      headers: {
        authorization: this.authToken(user),
      },
    });

    let items = JSON.parse(itemsResponse).data as Item[];

    items = items.concat(event.getLobby().getMeta<Item[] | undefined>("pgg.cosmetic.items") ?? []);

    const final: Item[] = [];

    for (let i = 0; i < items.length; i++) {
      if (!final.some(val => val.id === items[i].id)) {
        final.push(items[i]);
      }
    }

    event.getLobby().setMeta("pgg.cosmetic.items", final);
    event.getPlayer().getConnection()?.setMeta("pgg.cosmetics.ownedItems", items);

    for (let i = 0; i < final.length; i++) {
      this.loadItem(final[i], lobby);
      // setTimeout(() => {
      //   this.loadItem(final[i], lobby);
      // }, 3000 * i);
    }
  }
}
