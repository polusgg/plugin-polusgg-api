import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { Server } from "@nodepolus/framework/src/server";
import { ServiceType } from "../../types/enums";
import { EntityButton } from "../../entities";
import { Services } from "../services";
import { Button } from ".";
import { RpcPacket } from "@nodepolus/framework/src/protocol/packets/gameData";
import { SetCountingDown } from "../../packets/rpc/clickBehaviour/setCountingDown";
import { BaseInnerNetObject } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { InnerClickBehaviour } from "../../innerNetObjects";
import { ButtonCountdownUpdated } from "./events/buttonCountdownUpdated";
import { ClickPacket } from "../../packets/rpc/clickBehaviour";
import { ButtonFields } from "../../types/buttonFields";
import { InnerCustomNetworkTransformGeneric } from "../../innerNetObjects/innerCustomNetworkTransformGeneric";

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

    RpcPacket.registerPacket(0x90, SetCountingDown.deserialize, this.handleCountingDown.bind(this));
    RpcPacket.registerPacket(0x86, ClickPacket.deserialize, this.handleClickButton.bind(this));
  }

  async spawnButton(connection: Connection, { asset, position, maxTimer, currentTime, saturated, color, isCountingDown, alignment, z, attachedTo, keys }: ButtonFields, sendTo: Connection[] = [connection]): Promise<Button> {
    const lobby = connection.getLobby();

    if (lobby === undefined) {
      throw new Error("Attempted to spawn a button for a connection not in a lobby.");
    }

    await Services.get(ServiceType.Resource).assertLoaded(connection, asset);

    const parent = attachedTo === undefined ? undefined : InnerCustomNetworkTransformGeneric.findOwner(attachedTo);

    const button = new EntityButton(connection, asset.getId(), maxTimer, position, alignment, currentTime, saturated, color, isCountingDown, z, parent, keys);

    await lobby.spawn(button, sendTo);

    const buttonInstance = new Button(button, sendTo);

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

  private handleClickButton(connection: Connection, packet: ClickPacket, sender?: BaseInnerNetObject): void {
    if (sender === undefined) {
      throw new Error("HandleClickButton sent from unknown InnerNetObject");
    }

    const button = this.findSafeButtonByNetId(connection, sender.getNetId());

    if (button.isDestroyed()) {
      throw new Error("HandleClickButton sent on a destroyed Button");
    } else {
      button.emit("clicked", {
        connection,
        packet,
      });
    }
  }

  private async handleCountingDown(connection: Connection, packet: SetCountingDown, sender?: BaseInnerNetObject): Promise<void> {
    if (sender === undefined) {
      throw new Error("HandleCountingDown sent from unknown InnerNetObject");
    }

    if (sender.getType() as number !== 0x83) {
      throw new Error(`HandleCountingDown sent from a non-InnerClickBehaviour (${sender.getType()})`);
    }

    const innerClickBehaviour = sender as InnerClickBehaviour;
    const button = this.findSafeButtonByNetId(connection, innerClickBehaviour.getNetId());

    // fire

    const event = new ButtonCountdownUpdated();

    await button.emit(packet.requestCounting ? "button.countdown.started" : "button.countdown.stopped", event);

    if (event.isCancelled()) {
      return;
    }

    await button.setCurrentTime(packet.currentTimer);
    await button.setCountingDown(packet.requestCounting);
  }
}
