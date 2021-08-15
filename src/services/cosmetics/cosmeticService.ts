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

      const newHat = event.getPlayer().getLobby().getMeta<Item[] | undefined>("pgg.cosmetic.items")?.find(i => i.amongUsId === event.getNewHat());

      if (newHat === undefined) {
        event.cancel();

        if (event.getPlayer().getLobby().hasMeta("pgg.cosmetic.items")) {
          Services.get(ServiceType.Hud).displayNotification(`You attempted to apply a hat you don't own.`);
        }
      }
    });

    server.on("player.pet.updated", event => {
      if (event.getNewPet() < 10_000_000) {
        return;
      }

      const newHat = event.getPlayer().getLobby().getMeta<Item[] | undefined>("pgg.cosmetic.items")?.find(i => i.amongUsId === event.getNewPet());

      if (newHat === undefined) {
        event.cancel();

        if (event.getPlayer().getLobby().hasMeta("pgg.cosmetic.items")) {
          Services.get(ServiceType.Hud).displayNotification(`You attempted to apply a pet you don't own.`);
        }
      }
    });
  }

  async loadItem(item: Item, lobby: LobbyInstance) {
    const resourceService = Services.get(ServiceType.Resource);
    let LoadPacket: typeof LoadHatPacket | typeof LoadPetPacket;

    switch (item.type) {
      case "HAT": {
        LoadPacket = LoadHatPacket;
        break;
      }
      case "PET": {
        LoadPacket = LoadPetPacket;
        break;
      }
      default:
        throw new Error("I don't care");
    }

    AssetBundle.load(item.resource.path, item.resource.url).then(bundle => {
      const connections = lobby.getConnections();
      for (let i = 0; i < connections.length; i++) {
        const conn = connections[i];

        resourceService.load(conn, bundle).then(async () => {
          const ownedItems = conn.getMeta<Item[]>("pgg.cosmetics.ownedItems");
          console.log(`sending ${item.name} ${item.amongUsId} to ${conn.getName()}:${conn.getId()}`)
          await conn.writeReliable(new LoadPacket(
            item.amongUsId,
            item.resource.id,
            ownedItems.some((val) => val.amongUsId),
          ));

          const player = conn.getPlayer();
          if (player !== undefined && player.getHat() === item.amongUsId) {
            await player.setHat(item.amongUsId);
          }
        });
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

    items = items.concat(event.getLobby().getMeta("pgg.cosmetic.items") ?? []);
    const final: Item[] = [];

    for (let i = 0; i < items.length; i++) {
      if (!final.some((val) => val.id === items[i].id)) {
        final.push(items[i]);
      }
    }

    console.log(final);
    event.getLobby().setMeta("pgg.cosmetic.items", final);
    event.getPlayer().getConnection()?.setMeta("pgg.cosmetics.ownedItems", items);

    for (let i = 0; i < final.length; i++) {
      setTimeout(() => {
        this.loadItem(final[i], lobby);
      }, 3000 * i);
    }
  }
}
