import { Connection } from "../../../../../lib/protocol/connection";
import { MaxValue } from "../../../../../lib/util/constants";
import { CustomRootPacketType, FetchResourcePacket } from "../../packets/root";
import { FetchResourceResponseEndedPacket, FetchResourceResponseFailedPacket, FetchResourceResponsePacket } from "../../packets/root/fetchResource";

enum ResourceState {
  AwaitingResponse,
  Downloading,
}

interface Resource {
  location: string;
  state: ResourceState;
  hash: Buffer;
}

export class ResourceService {
  private readonly resourceIds: Map<Connection, Map<number, Resource>> = new Map();

  async load(connection: Connection, location: URL | string, hash: Buffer): Promise<{isCached: boolean; resourceId: number}> {
    const connectionResourceMap = this.getResourceMapForConnection(connection);
    const resourceId = Math.random() * MaxValue.UInt32;

    connectionResourceMap.set(resourceId, {
      location: location.toString(),
      state: ResourceState.AwaitingResponse,
      hash,
    });

    connection.writeReliable(new FetchResourcePacket(
      resourceId,
      location.toString(),
      hash,
    ));

    const { response } = await connection.awaitPacket(p => p.getType() === CustomRootPacketType.FetchResource as number &&
      (p as FetchResourceResponsePacket).resourceId == resourceId &&
      (p as FetchResourceResponsePacket).response.getType() !== 0x00,
    ) as FetchResourceResponsePacket;

    if (response.getType() == 0x01) {
      return {
        isCached: (response as FetchResourceResponseEndedPacket).didCache,
        resourceId: resourceId,
      };
    }

    throw new Error((response as FetchResourceResponseFailedPacket).reason.toString());
  }

  public getResourceMapForConnection(connection: Connection): Map<number, Resource> {
    if (!this.resourceIds.has(connection)) {
      this.resourceIds.set(connection, new Map());
    }

    return this.resourceIds.get(connection)!;
  }
}
