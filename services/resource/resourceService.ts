import { Connection } from "../../../../../lib/protocol/connection";
import { MaxValue } from "../../../../../lib/util/constants";
import { CustomRootPacketType, FetchResourcePacket } from "../../packets/root";
import { FetchResourceResponseEndedPacket, FetchResourceResponseFailedPacket, FetchResourceResponsePacket, ResourceType } from "../../packets/root/fetchResource";

enum ResourceState {
  AwaitingResponse,
  Downloading,
}

interface Resource {
  location: string;
  type: ResourceType;
  state: ResourceState;
}

export class ResourceService {
  private readonly resourceIds: Map<Connection, Map<number, Resource>> = new Map();

  async load(connection: Connection, location: URL | string, type: ResourceType, cacheDuration: number = 3600): Promise<{isCached: boolean; resourceId: number}> {
    const connectionResourceMap = this.getResourceMapForConnection(connection);
    const resourceId = Math.random() * MaxValue.UInt32;

    connectionResourceMap.set(resourceId, {
      location: location.toString(),
      type,
      state: ResourceState.AwaitingResponse,
    });

    connection.writeReliable(new FetchResourcePacket(
      resourceId,
      type,
      location.toString(),
      cacheDuration,
    ));

    const { response } = await connection.awaitPacket(p => p.type === CustomRootPacketType.FetchResource as number &&
      (p as FetchResourceResponsePacket).resourceId == resourceId &&
      (p as FetchResourceResponsePacket).response.type !== 0x00,
    ) as FetchResourceResponsePacket;

    if (response.type == 0x01) {
      return {
        isCached: (response as FetchResourceResponseEndedPacket).didCache,
        resourceId: resourceId,
      };
    }

    throw new Error((response as FetchResourceResponseFailedPacket).reason.toString());
  }

  private getResourceMapForConnection(connection: Connection): Map<number, Resource> {
    if (!this.resourceIds.has(connection)) {
      this.resourceIds.set(connection, new Map());
    }

    return this.resourceIds.get(connection)!;
  }
}
