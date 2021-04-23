import { NumberValue, BooleanValue, EnumValue, SetGameOption } from "../../packets/root/setGameOption";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { GameOptionsData } from "@nodepolus/framework/src/types";
import { Server } from "@nodepolus/framework/src/server";
import { LobbyOptions } from "./gameOptionsSet";

declare const server: Server;

export class GameOptionsService {
  constructor() {
    server.on("server.lobby.created", event => {
      /* eslint-disable @typescript-eslint/naming-convention */
      type LobbyDefaultOptions = {
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
      options.createOption("Task Settings", "Common Tasks", new NumberValue(0, 1, 0, -1, false, "ERROR"));
      options.createOption("Task Settings", "Long Tasks", new NumberValue(0, 1, 0, -1, false, "ERROR"));
      options.createOption("Task Settings", "Short Tasks", new NumberValue(0, 1, 0, -1, false, "ERROR"));
      options.createOption("Task Settings", "Visual Tasks", new BooleanValue(false));
      options.createOption("Task Settings", "Taskbar Mode", new EnumValue(0, ["Always", "Meetings", "Never"]));

      options.on("option.*.changed", changedEvent => {
        if (applyOption[changedEvent.getKey()] !== undefined) {
          applyOption[changedEvent.getKey()](changedEvent.getLobby(), changedEvent.getValue());
        }
      });

      event.getLobby().setMeta("pgg.optionSequenceId", 0);
    });

    server.on("player.joined", event => {
      if (event.getPlayer().getConnection() === undefined) {
        return;
      }

      const options = this.getGameOptions(event.getLobby());

      const sequenceId = this.nextSequenceId(event.getLobby());

      Object.entries(options.getAllOptions()).forEach(([_name, option]) => {
        event.getLobby().sendRootGamePacket(new SetGameOption(sequenceId, option.getCategory(), option.getKey(), option.getValue()), [event.getPlayer().getConnection()!]);
      });
    });
  }

  getGameOptions<T extends Record<string, NumberValue | BooleanValue | EnumValue>>(lobby: LobbyInstance): LobbyOptions<T> {
    return lobby.getMeta<LobbyOptions<T>>("pgg.options");
  }

  nextSequenceId(lobby: LobbyInstance): number {
    const sequenceId = lobby.getMeta<number>("pgg.optionSequenceId") + 1;

    lobby.setMeta("pgg.optionSequenceId", sequenceId);

    return sequenceId;
  }
}
