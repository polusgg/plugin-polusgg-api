import { NumberValue, BooleanValue, EnumValue, SetGameOption } from "../../packets/root/setGameOption";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { GameOptionsData } from "@nodepolus/framework/src/types";
import { Server } from "@nodepolus/framework/src/server";
import { LobbyOptions } from "./gameOptionsSet";
import { MaxValue } from "@nodepolus/framework/src/util/constants";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { Player } from "@nodepolus/framework/src/player";

declare const server: Server;

/* eslint-disable @typescript-eslint/naming-convention */
export type LobbyDefaultOptions = {
  "Map": EnumValue;
  "Impostor Count": NumberValue;
  "Max Button Presses": NumberValue;
  "Button Cooldown": NumberValue;
  "Discussion Time": NumberValue;
  "Voting Time": NumberValue;
  "Anon Votes": BooleanValue;
  "Confirm Ejects": BooleanValue;
  "Player Speed": NumberValue;
  "Crew Light Modifier": NumberValue;
  "Impostor Light Modifier": NumberValue;
  "Kill Cooldown": NumberValue;
  "Kill Distance": EnumValue;
  "Common Tasks": NumberValue;
  "Long Tasks": NumberValue;
  "Short Tasks": NumberValue;
  "Visual Tasks": BooleanValue;
  "Taskbar Mode": EnumValue;
};

export class GameOptionsService {
  constructor() {
    server.on("server.lobby.created", event => {
      const options = new LobbyOptions<LobbyDefaultOptions>(event.getLobby());

      const applyOption = {
        Map: (vanillaOptions: GameOptionsData, option: EnumValue) => { vanillaOptions.setLevels([option.index]) },
        "Impostor Count": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setLevels([option.value]) },
        "Max Button Presses": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setEmergencyMeetingCount(option.value) },
        "Button Cooldown": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setEmergencyCooldown(option.value) },
        "Discussion Time": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setDiscussionTime(option.value) },
        "Voting Time": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setVotingTime(option.value) },
        "Anon Votes": (vanillaOptions: GameOptionsData, option: BooleanValue) => { vanillaOptions.setAnonymousVoting(option.value) },
        "Confirm Ejects": (vanillaOptions: GameOptionsData, option: BooleanValue) => { vanillaOptions.setConfirmEjects(option.value) },
        "Player Speed": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setPlayerSpeedModifier(option.value) },
        "Crew Light Modifier": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setCrewmateLightModifier(option.value) },
        "Impostor Light Modifier": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setImpostorLightModifier(option.value) },
        "Kill Cooldown": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setKillCooldown(option.value) },
        "Kill Distance": (vanillaOptions: GameOptionsData, option: EnumValue) => { vanillaOptions.setKillDistance(option.index) },
        "Common Tasks": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setCommonTaskCount(option.value) },
        "Long Tasks": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setLongTaskCount(option.value) },
        "Short Tasks": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setShortTaskCount(option.value) },
        "Visual Tasks": (vanillaOptions: GameOptionsData, option: BooleanValue) => { vanillaOptions.setVisualTasks(option.value) },
        "Taskbar Mode": (vanillaOptions: GameOptionsData, option: EnumValue) => { vanillaOptions.setTaskBarUpdates(option.index) },
      } as const;
      /* eslint-enable @typescript-eslint/naming-convention */

      event.getLobby().setMeta("pgg.options", options);
      event.getLobby().setMeta("pgg.optionSequenceId", new Map());

      options.createOption("Game Settings", "Map", new EnumValue(0, ["The Skeld", "Mira HQ", "Polus", "Airship", "dlekS ehT"]));
      options.createOption("Game Settings", "Impostor Count", new NumberValue(1, 1, 1, 3, false, "{0} Impostors"));
      options.createOption("Meeting Settings", "Max Button Presses", new NumberValue(1, 1, 0, 9, false, "{0} Buttons"));
      options.createOption("Meeting Settings", "Button Cooldown", new NumberValue(15, 5, 0, 60, false, "{0}s"));
      options.createOption("Meeting Settings", "Discussion Time", new NumberValue(30, 30, 0, 300, true, "{0}s"));
      options.createOption("Meeting Settings", "Voting Time", new NumberValue(30, 30, 0, 300, true, "{0}s"));
      options.createOption("Meeting Settings", "Anon Votes", new BooleanValue(false));
      options.createOption("Meeting Settings", "Confirm Ejects", new BooleanValue(false));
      options.createOption("Player Settings", "Player Speed", new NumberValue(1, 0.25, 0.25, 3, false, "{0}x"));
      options.createOption("Player Settings", "Crew Light Modifier", new NumberValue(1, 0.25, 0.25, 3, false, "{0}x"));
      options.createOption("Player Settings", "Impostor Light Modifier", new NumberValue(1, 0.25, 0.25, 3, false, "{0}x"));
      options.createOption("Player Settings", "Kill Cooldown", new NumberValue(15, 5, 5, 60, false, "{0}s"));
      options.createOption("Player Settings", "Kill Distance", new EnumValue(0, ["Short", "Normal", "Long"]));
      options.createOption("Task Settings", "Common Tasks", new NumberValue(2, 1, 0, 2, false, "{0} tasks"));
      options.createOption("Task Settings", "Long Tasks", new NumberValue(2, 1, 0, 3, false, "{0} tasks"));
      options.createOption("Task Settings", "Short Tasks", new NumberValue(3, 1, 0, 5, false, "{0} tasks"));
      options.createOption("Task Settings", "Visual Tasks", new BooleanValue(false));
      options.createOption("Task Settings", "Taskbar Mode", new EnumValue(0, ["Always", "Meetings", "Never"]));

      options.on("option.*.changed", changedEvent => {
        if (applyOption[changedEvent.getKey()] !== undefined) {
          applyOption[changedEvent.getKey()](changedEvent.getLobby().getOptions(), changedEvent.getValue());
          (changedEvent.getLobby().getPlayers()[0] as Player).getEntity().getPlayerControl().syncSettings(changedEvent.getLobby().getOptions(), changedEvent.getLobby().getConnections());
        }
      });
    });

    server.on("server.lobby.join", event => {
      if (event.getLobby() === undefined) {
        return;
      }

      event.getLobby()!.getMeta<Map<number, number>>("pgg.optionSequenceId").set(event.getConnection().getId(), -1);
    });

    server.on("player.joined", event => {
      if (event.getPlayer().getConnection() === undefined) {
        return;
      }

      const options = this.getGameOptions(event.getLobby());

      Object.entries(options.getAllOptions()).forEach(([_name, option]) => {
        const sequenceId = this.nextSequenceId(event.getLobby(), event.getPlayer().getConnection()!);

        event.getLobby().sendRootGamePacket(new SetGameOption(sequenceId, option.getCategory(), option.getKey(), option.getValue()), [event.getPlayer().getConnection()!]);
      });
    });
  }

  getGameOptions<T extends Record<string, NumberValue | BooleanValue | EnumValue>>(lobby: LobbyInstance): LobbyOptions<T> {
    return lobby.getMeta<LobbyOptions<T>>("pgg.options");
  }

  nextSequenceId(lobby: LobbyInstance, connection: Connection): number {
    const map = lobby.getMeta<Map<number, number>>("pgg.optionSequenceId");

    const sequenceId = map.get(connection.getId())! + 1;

    map.set(connection.getId(), sequenceId % MaxValue.UInt16);

    return sequenceId;
  }
}
