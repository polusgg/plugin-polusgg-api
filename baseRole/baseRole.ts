import { ServerEvents } from "../../../../lib/api/events";
import { EventCatcher } from ".";
import { LobbyInstance } from "../../../../lib/api/lobby";
import { PlayerInstance } from "../../../../lib/api/player";
import { Game } from "../../../../lib/api/game";
import { Connection } from "../../../../lib/protocol/connection";
import { BaseInnerNetEntity, BaseInnerNetObject } from "../../../../lib/protocol/entities/baseEntity";
import { Lobby } from "../../../../lib/lobby";
import { Player } from "../../../../lib/player";
import { StartGameScreenData } from "../services/roleManager/roleManagerService";

export type Ownable = LobbyInstance | PlayerInstance | Connection | Game | BaseInnerNetEntity | BaseInnerNetObject;

export class BaseRole {
  constructor(private readonly owner: PlayerInstance) {}

  getAssignmentScreen(_player: PlayerInstance): StartGameScreenData {
    return {
      title: "undefined",
      subtitle: "no data was sent from the server for your assignment screen",
      color: [127, 127, 127, 255],
    };
  }

  catch<NameType extends Extract<keyof ServerEvents, string>>(eventName: NameType): EventCatcher<NameType> {
    return new EventCatcher(eventName);
  }

  owns(thing: Ownable): boolean {
    if (thing instanceof Lobby) {
      return this.owner.getLobby() === thing;
    }

    if (thing instanceof Player) {
      return this.owner === thing;
    }

    if (thing instanceof Connection) {
      return this.owner.getConnection() === thing;
    }

    if (thing instanceof Game || thing instanceof BaseInnerNetEntity || thing instanceof BaseInnerNetObject) {
      return this.owner.getLobby() === thing.getLobby();
    }

    throw new Error("Input invalid.");
  }
}
