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

declare const server: Server;

export class CosmeticService {
  private readonly fetchCosmetic: Got;
  constructor() {
    this.fetchCosmetic = got.extend({ prefixUrl: "http://cosmetics.service.polus.gg:2219/v1/" });

    server.on("player.joined", event => {
      if (event.getPlayer().getConnection() !== undefined) {
        this.playerJoined(event);
      }
    });

    server.on("player.hat.updated", event => {
      if (event.getNewHat() < 10_000_000) {
        return;
      }

      const newHat = event.getPlayer().getMeta<Item[] | undefined>("pgg.cosmetic.items")?.find(i => i.amongUsId === event.getNewHat());

      if (newHat === undefined) {
        event.cancel();

        if (event.getPlayer().hasMeta("pgg.cosmetic.items")) {
          Services.get(ServiceType.Hud).displayNotification(`You attempted to apply a hat you don't own.`);
        }
      }
    });

    server.on("player.pet.updated", event => {
      if (event.getNewPet() < 10_000_000) {
        return;
      }

      const newHat = event.getPlayer().getMeta<Item[] | undefined>("pgg.cosmetic.items")?.find(i => i.amongUsId === event.getNewPet());

      if (newHat === undefined) {
        event.cancel();

        if (event.getPlayer().hasMeta("pgg.cosmetic.items")) {
          Services.get(ServiceType.Hud).displayNotification(`You attempted to apply a pet you don't own.`);
        }
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
    const user = (event.getLobby().getActingHosts()[0] ?? event.getLobby().getCreator()).getMeta<UserResponseStructure>("pgg.auth.self");

    const { body: itemsResponse } = await this.fetchCosmetic("item", {
      headers: {
        authorization: this.authToken(user),
      },
    });

    const items = JSON.parse(itemsResponse).data as Item[];

    event.getPlayer().setMeta("pgg.cosmetic.items", items);

    // console.log(`[COSMETIC] ${user.client_id} joined`);

    // const { body: purchaseBody } = await this.fetchCosmetic<string>("purchases", {
    //   headers: {
    //     // eslint-disable-next-line @typescript-eslint/naming-convention
    //     Authorization: this.authToken(user),
    //   },
    // });

    // const purchases = JSON.parse(purchaseBody) as { ok: boolean; data: Purchase[]; cause: string };
    // const bundlePromises: Promise<Bundle>[] = [];

    // console.log(`[COSMETIC] HAS Purchases`, purchases);

    // for (let i = 0; i < purchases.data.length; i++) {
    //   bundlePromises.push((async (): Promise<Bundle> => {
    //     const { body: bundleBody } = await this.fetchCosmetic<string>(`bundle/${purchases.data[i].bundleId}`, {
    //       method: "GET",
    //       headers: {
    //         // eslint-disable-next-line @typescript-eslint/naming-convention
    //         Authorization: this.authToken(user),
    //       },
    //     });

    //     const bundle = JSON.parse(bundleBody) as { ok: boolean; data: Bundle; cause: string };

    //     return bundle.data;
    //   })());
    // }

    // const bundles = await Promise.all(bundlePromises);
    // const itemIds = bundles.flatMap(bundle => bundle.items);
    // const itemPromises: Promise<Item>[] = [];

    // for (let i = 0; i < itemIds.length; i++) {
    //   itemPromises.push((async (): Promise<Item> => {
    //     const { body: itemBody } = await this.fetchCosmetic<string>(`item/${itemIds[i]}`, {
    //       method: "GET",
    //       headers: {
    //         // eslint-disable-next-line @typescript-eslint/naming-convention
    //         Authorization: this.authToken(user),
    //       },
    //     });

    //     const item = JSON.parse(itemBody) as { ok: boolean; data: Item; cause: string };

    //     return item.data;
    //   })());
    // }

    // const items = await Promise.all(itemPromises);
    const resourceService = Services.get(ServiceType.Resource);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      console.log(`loading ${item.resource.url}/${item.resource.path}`);

      switch (item.type) {
        case "HAT": {
          AssetBundle.load(item.resource.path, item.resource.url).then(bundle => {
            resourceService.load(event.getPlayer().getSafeConnection(), bundle).then(() => {
              event.getPlayer().getSafeConnection().writeReliable(new LoadHatPacket(
                item.amongUsId,
                item.resource.id,
                true,
              ));
            });
          });
          break;
        }
        case "PET": {
          // break;
          AssetBundle.load(item.resource.path, item.resource.url).then(bundle => {
            resourceService.load(event.getPlayer().getSafeConnection(), bundle).then(() => {
              event.getPlayer().getSafeConnection().writeReliable(new LoadPetPacket(
                item.amongUsId,
                item.resource.id,
                true,
              ));
            });
          });
          break;
        }
        default:
          throw new Error("I don't care");
      }
    }
  }
}
