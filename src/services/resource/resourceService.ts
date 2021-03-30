import { FetchResourceResponseEndedPacket, FetchResourceResponseFailedPacket } from "../../packets/root/fetchResource";
import { FetchResourcePacket, FetchResourceResponsePacket } from "../../packets/root";
import { CustomRootPacketType, ResourceState, ResourceType } from "../../types/enums";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { Resource, ResourceResponse } from "../../types";

export class ResourceService {
  private readonly resourceIds: Map<Connection, Map<number, Resource>> = new Map();

  async load(connection: Connection, resourceId: number, location: URL | string, hash: Buffer): Promise<ResourceResponse> {
    this.getResourceMapForConnection(connection).set(resourceId, {
      location: location.toString(),
      state: ResourceState.AwaitingResponse,
      hash,
    });

    connection.writeReliable(new FetchResourcePacket(
      resourceId,
      location.toString(),
      hash,
      ResourceType.AssetBundle,
    ));

    const { response } = await connection.awaitPacket(p => p.getType() === CustomRootPacketType.FetchResource as number
      && (p as FetchResourceResponsePacket).resourceId == resourceId
      && (p as FetchResourceResponsePacket).response.getType() !== 0x00,
    ) as FetchResourceResponsePacket;

    if (response.getType() == 0x01) {
      return {
        isCached: (response as FetchResourceResponseEndedPacket).didCache,
        resourceId: resourceId,
      };
    }

    throw new Error((response as FetchResourceResponseFailedPacket).reason.toString());
  }

  getResourceMapForConnection(connection: Connection): Map<number, Resource> {
    if (!this.resourceIds.has(connection)) {
      this.resourceIds.set(connection, new Map());
    }

    return this.resourceIds.get(connection)!;
  }
}
