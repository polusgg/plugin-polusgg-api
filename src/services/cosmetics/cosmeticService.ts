import { Player } from "@nodepolus/framework/src/player";
import { Server } from "@nodepolus/framework/src/server";
import { SetPlayerBodyPacket } from "../../packets/rpc/playerControl/setPlayerBody";
import got, { Got } from "got";
import { UserResponseStructure } from "@polusgg/module-polusgg-auth-api/src/types/userResponseStructure";
import { PlayerJoinedEvent } from "@nodepolus/framework/src/api/events/player";
import { Purchase } from "../../types/purchase";
import { Bundle } from "../../types/bundle";
import { Item } from "../../../../server-cosmetics/src/database/types";
import { LoadHatPacket } from "../../packets/root/loadHatPacket";
import { LoadPetPacket } from "../../packets/root/loadPetPacket";
import { AssetBundle } from "../../assets";
import { ServiceType } from "../../types/enums";
import { Services } from "../services";

declare const server: Server;

export class CosmeticService {
  private readonly fetchCosmetic: Got;
  constructor() {
    this.fetchCosmetic = got.extend({ prefixUrl: "http://127.0.0.1:2219/v1/" });

    console.log("yeah this got called");

    server.on("player.joined", event => {
      if (event.getPlayer().getConnection() !== undefined) {
        this.playerJoined(event);
      }
    });
  }

  authToken(user: UserResponseStructure) {
    return `${user.client_token}:${user.client_id}`;
  }

  async setBody(player: Player, body: number): Promise<void> {
    await player.getEntity().getPlayerControl().sendRpcPacket(new SetPlayerBodyPacket(body), player.getLobby().getConnections());
  }

  private async playerJoined(event: PlayerJoinedEvent): Promise<void> {
    return;

    const user = (event.getLobby().getActingHosts()[0] ?? event.getLobby().getCreator()).getMeta<UserResponseStructure>("pgg.auth.self");

    const { body: purchaseBody } = await this.fetchCosmetic<string>("purchases", {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: this.authToken(user),
      },
    });

    const purchases = JSON.parse(purchaseBody) as { ok: boolean; data: Purchase[]; cause: string };
    const bundlePromises: Promise<Bundle>[] = [];

    for (let i = 0; i < purchases.data.length; i++) {
      bundlePromises.push((async (): Promise<Bundle> => {
        const { body: bundleBody } = await this.fetchCosmetic<string>(`bundle/${purchases.data[i].bundleId}`, {
          method: "GET",
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Authorization: this.authToken(user),
          },
        });

        const bundle = JSON.parse(bundleBody) as { ok: boolean; data: Bundle; cause: string };

        return bundle.data;
      })());
    }

    const bundles = await Promise.all(bundlePromises);
    const itemIds = bundles.flatMap(bundle => bundle.items);
    const itemPromises: Promise<Item>[] = [];

    for (let i = 0; i < itemIds.length; i++) {
      itemPromises.push((async (): Promise<Item> => {
        const { body: itemBody } = await this.fetchCosmetic<string>(`item/${itemIds[i]}`, {
          method: "GET",
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Authorization: this.authToken(user),
          },
        });

        const item = JSON.parse(itemBody) as { ok: boolean; data: Item; cause: string };

        return item.data;
      })());
    }

    const items = await Promise.all(itemPromises);
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
