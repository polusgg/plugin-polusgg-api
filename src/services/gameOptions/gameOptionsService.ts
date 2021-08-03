import { NumberValue, BooleanValue, EnumValue, SetGameOption } from "../../packets/root/setGameOption";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { GameOptionsData } from "@nodepolus/framework/src/types";
import { Server } from "@nodepolus/framework/src/server";
import { GameOptionPriority, LobbyOptions } from "./gameOptionsSet";
import { MaxValue } from "@nodepolus/framework/src/util/constants";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { Player } from "@nodepolus/framework/src/player";
import { Level } from "@nodepolus/framework/src/types/enums";

declare const server: Server;

/* eslint-disable @typescript-eslint/naming-convention */
export type LobbyDefaultOptions = {
  "Map": EnumValue;
  "Impostor Count": NumberValue;
  "Emergency Meetings": NumberValue;
  "Emergency Cooldown": NumberValue;
  "Discussion Time": NumberValue;
  "Voting Time": NumberValue;
  "Anonymous Votes": BooleanValue;
  "Confirm Ejects": BooleanValue;
  "Player Speed": NumberValue;
  "Crewmate Vision": NumberValue;
  "Impostor Vision": NumberValue;
  "Kill Cooldown": NumberValue;
  "Kill Distance": EnumValue;
  "Common Tasks": NumberValue;
  "Long Tasks": NumberValue;
  "Short Tasks": NumberValue;
  "Visual Tasks": BooleanValue;
  "Task Bar Updates": EnumValue;
};

export const vanillaGameOptions = new Set([
  "Map",
  "Impostor Count",
  "Emergency Meetings",
  "Emergency Cooldown",
  "Discussion Time",
  "Voting Time",
  "Anonymous Votes",
  "Confirm Ejects",
  "Player Speed",
  "Crewmate Vision",
  "Impostor Vision",
  "Kill Cooldown",
  "Kill Distance",
  "Common Tasks",
  "Long Tasks",
  "Short Tasks",
  "Visual Tasks",
  "Task Bar Updates",
]);

export class GameOptionsService {
  constructor() {
    server.on("lobby.options.updated", event => {
      event.cancel();
    });

    server.on("server.lobby.created", event => {
      const options = new LobbyOptions<LobbyDefaultOptions>(event.getLobby());

      event.getLobby().getOptions().setVersion(4);

      const applyOption = {
        Map: (vanillaOptions: GameOptionsData, option: EnumValue) => {
          if (option.index < Level.AprilSkeld) {
            vanillaOptions.setLevels([option.index]);
          } else {
            vanillaOptions.setLevels([option.index + 1]);
          }
        },
        "Impostor Count": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setImpostorCount(option.value) },
        "Emergency Meetings": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setEmergencyMeetingCount(option.value) },
        "Emergency Cooldown": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setEmergencyCooldown(option.value) },
        "Discussion Time": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setDiscussionTime(option.value) },
        "Voting Time": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setVotingTime(option.value) },
        "Anonymous Votes": (vanillaOptions: GameOptionsData, option: BooleanValue) => { vanillaOptions.setAnonymousVoting(option.value) },
        "Confirm Ejects": (vanillaOptions: GameOptionsData, option: BooleanValue) => { vanillaOptions.setConfirmEjects(option.value) },
        "Player Speed": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setPlayerSpeedModifier(option.value) },
        "Crewmate Vision": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setCrewmateLightModifier(option.value) },
        "Impostor Vision": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setImpostorLightModifier(option.value) },
        "Kill Cooldown": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setKillCooldown(option.value) },
        "Kill Distance": (vanillaOptions: GameOptionsData, option: EnumValue) => { vanillaOptions.setKillDistance(option.index) },
        "Common Tasks": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setCommonTaskCount(option.value) },
        "Long Tasks": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setLongTaskCount(option.value) },
        "Short Tasks": (vanillaOptions: GameOptionsData, option: NumberValue) => { vanillaOptions.setShortTaskCount(option.value) },
        "Visual Tasks": (vanillaOptions: GameOptionsData, option: BooleanValue) => { vanillaOptions.setVisualTasks(option.value) },
        "Task Bar Updates": (vanillaOptions: GameOptionsData, option: EnumValue) => { vanillaOptions.setTaskBarUpdates(option.index) },
      } as const;
      /* eslint-enable @typescript-eslint/naming-convention */

      event.getLobby().setMeta("pgg.options", options);
      event.getLobby().setMeta("pgg.optionSequenceId", new Map());

      options.on("option.*.changed", changedEvent => {
        if (applyOption[changedEvent.getKey()] !== undefined) {
          applyOption[changedEvent.getKey()](changedEvent.getLobby().getOptions(), changedEvent.getValue());

          if (changedEvent.getLobby().getPlayers().length >= 1) {
            (changedEvent.getLobby().getPlayers()[0] as Player).getEntity().getPlayerControl().syncSettings(changedEvent.getLobby().getOptions(), changedEvent.getLobby().getConnections());
          }
        }
      });

      // fixing a race condition :smile:
      setTimeout(() => {
        options.createOption("Game Settings", "Map", new EnumValue(0, ["The Skeld", "Mira HQ", "Polus", "Airship", "Submerged"]), GameOptionPriority.Higher - 12);
        options.createOption("Game Settings", "Impostor Count", new NumberValue(1, 1, 1, 3, false, `{0} Impostors`), GameOptionPriority.Higher - 11);
        options.createOption("Meeting Settings", "Anonymous Votes", new BooleanValue(false), GameOptionPriority.Higher - 10);
        options.createOption("Meeting Settings", "Confirm Ejects", new BooleanValue(false), GameOptionPriority.Higher - 9);
        options.createOption("Meeting Settings", "Discussion Time", new NumberValue(30, 15, 0, 300, true, "{0}s"), GameOptionPriority.Higher - 8);
        options.createOption("Meeting Settings", "Voting Time", new NumberValue(30, 30, 0, 300, true, "{0}s"), GameOptionPriority.Higher - 8);
        options.createOption("Meeting Settings", "Emergency Cooldown", new NumberValue(15, 5, 0, 60, false, "{0}s"), GameOptionPriority.Higher - 7);
        options.createOption("Meeting Settings", "Emergency Meetings", new NumberValue(1, 1, 0, 9, false, "{0} Buttons"), GameOptionPriority.Higher - 7);
        options.createOption("Player Settings", "Player Speed", new NumberValue(1, 0.25, 0.25, 3, false, "{0}x"), GameOptionPriority.Higher - 6);
        options.createOption("Player Settings", "Crewmate Vision", new NumberValue(1, 0.25, 0.25, 3, false, "{0}x"), GameOptionPriority.Higher - 5);
        options.createOption("Player Settings", "Impostor Vision", new NumberValue(1, 0.25, 0.25, 3, false, "{0}x"), GameOptionPriority.Higher - 5);
        options.createOption("Player Settings", "Kill Cooldown", new NumberValue(10, 2.5, 5, 60, false, "{0}s"), GameOptionPriority.Higher - 4);
        options.createOption("Player Settings", "Kill Distance", new EnumValue(0, ["Short", "Normal", "Long"]), GameOptionPriority.Higher - 4);
        options.createOption("Task Settings", "Visual Tasks", new BooleanValue(false), GameOptionPriority.Higher - 3);
        options.createOption("Task Settings", "Task Bar Updates", new EnumValue(0, ["Always", "Meetings", "Never"]), GameOptionPriority.Higher - 2);
        options.createOption("Task Settings", "Common Tasks", new NumberValue(2, 1, 0, 2, false, "{0} tasks"), GameOptionPriority.Higher - 1);
        options.createOption("Task Settings", "Long Tasks", new NumberValue(2, 1, 0, 3, false, "{0} tasks"), GameOptionPriority.Higher - 1);
        options.createOption("Task Settings", "Short Tasks", new NumberValue(3, 1, 0, 5, false, "{0} tasks"), GameOptionPriority.Higher - 1);

      }, 100);
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

        event.getLobby().sendRootGamePacket(new SetGameOption(sequenceId, option.getCategory(), option.getPriority(), option.getKey(), option.getValue()), [event.getPlayer().getConnection()!]);
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
