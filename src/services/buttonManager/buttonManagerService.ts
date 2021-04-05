import { GameDataPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { EdgeAlignments } from "../../types/enums/edgeAlignment";
import { Server } from "@nodepolus/framework/src/server";
import { Vector2 } from "@nodepolus/framework/src/types";
import { ServiceType } from "../../types/enums";
import { EntityButton } from "../../entities";
import { Services } from "../services";
import { Button } from ".";

declare const server: Server;

export class ButtonManagerService {
  protected buttonMap: Map<LobbyInstance, Map<number, Button>> = new Map();

  constructor() {
    server.on("server.lobby.created", event => {
      this.buttonMap.set(event.getLobby(), new Map());
    });

    server.on("server.lobby.destroyed", event => {
      this.buttonMap.delete(event.getLobby());
    });
  }

  async spawnButton(connection: Connection, { resourceId, position, maxTimer, currentTime, color, isCountingDown }: {
    resourceId: number;
    position: Vector2 | EdgeAlignments;
    maxTimer: number;
    currentTime?: number;
    color?: [number, number, number, number];
    isCountingDown?: boolean;
  }): Promise<Button> {
    const lobby = connection.getLobby();

    if (lobby === undefined) {
      throw new Error("Attempted to spawn a button for a connection not in a lobby.");
    }

    if (!Services.get(ServiceType.Resource).getResourceMapForConnection(connection).has(resourceId)) {
      throw new Error(`Attempted to spawn a button with a resource id of ${resourceId} for a connection that did not have that resource loaded.`);
    }

    let button: EntityButton;

    if (position instanceof Vector2) {
      button = new EntityButton(connection, resourceId, maxTimer, position, EdgeAlignments.None, currentTime, color, isCountingDown);
    } else {
      button = new EntityButton(connection, resourceId, maxTimer, Vector2.zero(), position, currentTime, color, isCountingDown);
    }

    await connection.writeReliable(new GameDataPacket([button.serializeSpawn()], lobby.getCode()));

    const buttonInstance = new Button(button);

    buttonInstance.getEntity().getObjects().forEach(object => {
      this.buttonMap.get(lobby)!.set(object.getNetId(), buttonInstance);
    });

    return buttonInstance;
  }

  findButtonByNetId(arg0: LobbyInstance | Connection, netId: number): Button | undefined {
    const lobby = arg0 instanceof Connection ? arg0.getLobby() : arg0;

    if (!lobby) {
      throw new Error("Passed connection not in a lobby.");
    }

    // assert lobby exists here because we don't want to return
    // undefined if the lobby doesn't exist.
    //
    // if the consumer thinks the lobby exists on this map
    // and the button exists on their lobby
    // they will mistake an undefined return as "the button
    // isn't on my lobby" rather than "my lobby doesn't exist"

    return this.buttonMap.get(lobby)!.get(netId);
  }

  findSafeButtonByNetId(arg0: LobbyInstance | Connection, netId: number): Button {
    const result = this.findButtonByNetId(arg0, netId);

    if (result === undefined) {
      throw new Error(`Button with netId ${netId} did not exist on the lobby.`);
    }

    return result;
  }
}
