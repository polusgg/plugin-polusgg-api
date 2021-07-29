import { FetchResourceResponseEndedPacket, FetchResourceResponseFailedPacket } from "../../packets/root/fetchResource";
import { FetchResourcePacket, FetchResourceResponsePacket } from "../../packets/root";
import { CustomRootPacketType, ResourceType } from "../../types/enums";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { ResourceResponse } from "../../types";
import { Asset, AssetBundle } from "../../assets";
import { Server } from "@nodepolus/framework/src/server";
import { DisconnectReason } from "@nodepolus/framework/src/types";

declare const server: Server;

export class ResourceService {
  protected globalAssetBundle!: AssetBundle;

  private readonly loadedBundlesMap: Map<Connection, AssetBundle[]> = new Map();

  constructor() {
    AssetBundle.load("Global").then(bundle => {
      this.globalAssetBundle = bundle;

      server.getLogger("ResourceService").info("Global AssetBundle loaded.");
    });

    server.on("connection.opened", event => {
      this.load(event.getConnection(), this.globalAssetBundle);
    });
  }

  async load(connection: Connection, assetBundle: AssetBundle): Promise<ResourceResponse> {
    const preloaded = this.getLoadedAssetBundlesForConnection(connection);

    if (preloaded.includes(assetBundle)) {
      return {
        isCached: true,
        resourceId: assetBundle.getId(),
      };
    }

    try {
      return await this.loadSingle(connection, assetBundle);
    } catch {
      // failed the first attempt.
      // try again
      try {
        return await this.loadSingle(connection, assetBundle);
      } catch {
        // failed the second attempt.
        // TODO: Don't cache.
        // try again
        try {
          return await this.loadSingle(connection, assetBundle);
        } catch (err) {
          await connection.disconnect(DisconnectReason.custom("Failed to load assets. The issue has been reported to the developers."));
          throw err;
        }
      }
    }
  }

  async assertLoaded(connection: Connection, asset: Asset): Promise<void> {
    const assetIds = this.getLoadedAssetBundlesForConnection(connection)
      .map(bundle => bundle.getContents())
      .flat()
      .map(singleAsset => singleAsset.getId());

    if (assetIds.includes(asset.getId())) {
      return;
    }

    server.getLogger("Polus.gg Resource Service").warn(`Asset "${asset.getPath().join("/")}" (${asset.getId()}) from assetBundle "${asset.getBundle().getAddress()}" (${asset.getBundle().getId()}) was asserted to be loaded, but did not exist on the connection's LoadedBundles array`);

    await this.load(connection, asset.getBundle());
  }

  getLoadedAssetBundlesForConnection(connection: Connection): AssetBundle[] {
    if (!this.loadedBundlesMap.has(connection)) {
      this.loadedBundlesMap.set(connection, []);
    }

    return this.loadedBundlesMap.get(connection)!;
  }

  getGlobalBundle(): AssetBundle {
    return this.globalAssetBundle;
  }

  private async loadSingle(connection: Connection, assetBundle: AssetBundle): Promise<ResourceResponse> {
    await connection.writeReliable(new FetchResourcePacket(
      assetBundle.getId(),
      assetBundle.getAddress(),
      Buffer.from(assetBundle.getHash(), "hex"),
      ResourceType.AssetBundle,
    ));

    const { response } = await connection.awaitPacket(p => p.getType() === CustomRootPacketType.FetchResource as number
      && (p as FetchResourceResponsePacket).resourceId == assetBundle.getId()
      && (p as FetchResourceResponsePacket).response.getType() !== 0x00,
    10000,
    ) as FetchResourceResponsePacket;

    if (response.getType() == 0x01) {
      this.getLoadedAssetBundlesForConnection(connection).push(assetBundle);

      return {
        isCached: (response as FetchResourceResponseEndedPacket).didCache,
        resourceId: assetBundle.getId(),
      };
    }

    throw new Error(`Client sent Error: ${(response as FetchResourceResponseFailedPacket).reason.toString()}`);
  }
}
