import { inspect } from "util";
import { RootPacket } from "@nodepolus/framework/src/protocol/packets/hazel";
import { AlterGameTag } from "@nodepolus/framework/src/types/enums";
import { BasePlugin } from "@nodepolus/framework/src/api/plugin";
import { RevivePacket } from "./src/packets/rpc/playerControl";
import { Player } from "@nodepolus/framework/src/player";
import { FetchResourceResponsePacket, ResizePacket } from "./src/packets/root";
import { ServiceType } from "./src/types/enums";
import { BaseMod } from "./src/baseMod/baseMod";
import { Services } from "./src/services";
import { BooleanValue, EnumValue, NumberValue, SetGameOption } from "./src/packets/root/setGameOption";
import { VanillaWinConditions } from "./src/services/endGame/vanillaWinConditions";
import { BaseRole, RoleAlignment } from "./src/baseRole/baseRole";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { Events } from "@polusgg/plugin-logger/events";
import { GameOptionPriority } from "./src/services/gameOptions/gameOptionsSet";
import { GameOption } from "./src/services/gameOptions/gameOption";

declare global {
  interface Object {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    log(...data: any[]);
  }
}

export default class PolusGGApi extends BasePlugin {
  protected readonly lastIndex: Map<LobbyInstance, number> = new Map();
  protected readonly updateGamemodeRunning: Map<LobbyInstance, boolean> = new Map();
  protected readonly updateGamemodeQueue: Map<LobbyInstance, number[]> = new Map();
  private readonly mods: BaseMod[] = [];

  constructor() {
    super({
      name: "Polus.gg API",
      version: [1, 0, 0],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.prototype.log = function logToDispleaseRoobscoob(this: any, ...data: any[]): void {
      data.unshift(this);

      for (let i = 0; i < data.length; i++) {
        process.stdout.write(inspect(data[i], { colors: true }));
        process.stdout.write(" ");
      }

      process.stdout.write("\n");

      return this;
    };

    RootPacket.registerPacket(0x81, ResizePacket.deserialize, (connection, packet) => {
      connection.setMeta({
        displaySize: {
          width: packet.width,
          height: packet.height,
        },
      });
    });

    RootPacket.registerPacket(0x80, FetchResourceResponsePacket.deserialize, (_connection, _packet) => {
      // ignored
    });

    RootPacket.registerPacket(0x89, SetGameOption.deserialize, (connection, packet) => {
      const gameOptions = Services.get(ServiceType.GameOptions).getGameOptions(connection.getSafeLobby());
      const option = gameOptions.getOption(packet.name) as GameOption<NumberValue | BooleanValue | EnumValue> | undefined;

      if (option === undefined) {
        // TODO: Cry
        return;
      }

      if (!option.getValue().validate(packet.value)) {
        // TODO: Cry
        return;
      }

      if (connection.isActingHost()) {
        gameOptions.setOption(packet.name, packet.value, connection.getLobby()!.getConnections().filter(c => c != connection));
      }
    });

    BaseMod.owner = this;

    this.server.on("game.ended", event => {
      if (event.getReason() as number !== 0x07) {
        event.cancel();
      }
    });

    this.server.on("game.started", event => {
      event.setImpostors([]);

      const options = Services.get(ServiceType.GameOptions).getGameOptions(event.getGame().getLobby()).getAllOptions();

      const settings = Object.fromEntries(Object.entries(options).map(([a, b]) => {
        const v = b.getValue();

        if (v instanceof EnumValue) {
          return [a, v.getSelected()];
        }

        return [a, v.value];
      }));

      Events.fire({
        type: "gameSettings",
        gameUuid: event.getGame().getMeta<string>("pgg.log.uuid"),
        settings,
      });

      const roles = this.mods.filter(mod => mod.getEnabled(event.getGame().getLobby())).map(e => e.getRoles(event.getGame().getLobby())).flat();
      // const impostorRoleDecls = roles.filter(r => r.assignWith === RoleAlignment.Impostor);
      // const impostorCounts = impostorRoleDecls.reduce((a, r) => a + r.playerCount, 0);

      //
      // if (impostorRoleDecls.length > 0) {
      //   event.setImpostors(shuffleArrayClone(event.getGame().getLobby().getPlayers()).slice(0, RoleManagerService.adjustImpostorCount(event.getGame().getLobby().getPlayers().length)));
      // }
      //
      // event.getImpostors().forEach(p => p.setRole(PlayerRole.Impostor));

      Services.get(ServiceType.RoleManager).assignRoles(event.getGame(), roles);
    });

    this.server.on("server.lobby.created", async event => {
      event.getLobby().setGameTag(AlterGameTag.ChangePrivacy, 1);

      if (this.mods.length === 0) {
        return;
      }

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const options = Services.get(ServiceType.GameOptions).getGameOptions<{ Gamemode: EnumValue }>(event.getLobby());

      const option = await options.createOption("", "Gamemode", new EnumValue(
        0,
        this.mods.map(mod => mod.getMetadata().name),
      ), GameOptionPriority.Highest);

      await this.mods[option.getValue().index].onEnable(event.getLobby());

      this.updateGamemodeRunning.set(event.getLobby(), false);
      this.updateGamemodeQueue.set(event.getLobby(), []);
      this.lastIndex.set(event.getLobby(), option.getValue().index);

      options.on("option.Gamemode.changed", suboption => {
        this.updateGamemodeQueue.get(suboption.getLobby())!.push(suboption.getValue().index);

        this.updateGamemode(suboption.getLobby()!);
      });
    });

    this.server.on("player.joined", event => {
      event.getPlayer().setMeta("pgg.api.targetable", true);

      setTimeout(() => {
        Services.get(ServiceType.Hud).updateQrCodeState(event.getPlayer().getSafeConnection());
      }, 100);
    });

    this.server.on("game.started", event => {
      setTimeout(() => {
        event.getGame().getLobby().getRealPlayers()
          .forEach(player => {
            Services.get(ServiceType.Hud).updateQrCodeState(player.getSafeConnection());
          });
      }, 100);
    });

    this.server.on("game.ended", event => {
      setTimeout(() => {
        event.getGame().getLobby().getRealPlayers()
          .forEach(player => {
            Services.get(ServiceType.Hud).updateQrCodeState(player.getSafeConnection());
          });
      }, 100);
    });

    VanillaWinConditions.setup(this.server);

    Player.prototype.revive = async function revive(this: Player): Promise<void> {
      this.getGameDataEntry().setDead(false);
      this.updateGameData();
      this.getEntity().getPlayerControl().sendRpcPacket(new RevivePacket(), this.getLobby().getConnections());

      return new Promise(r => r());
    };

    const fallbackIsImpostor = Player.prototype.isImpostor;

    Player.prototype.isImpostor = function isImpostor(this: Player): boolean {
      if (!this.hasMeta("pgg.api.role")) {
        return fallbackIsImpostor.apply(this);
      }

      return this.getMeta<BaseRole>("pgg.api.role").getAlignment() === RoleAlignment.Impostor;
    };
  }

  registerMod(mod: BaseMod): void {
    this.mods.push(mod);
  }

  async updateGamemode(lobby: LobbyInstance): Promise<void> {
    console.log("[UG] Called", this.updateGamemodeRunning.get(lobby));

    if (this.updateGamemodeRunning.get(lobby)) {
      return;
    }

    this.updateGamemodeRunning.set(lobby, true);

    console.log("[UG] onlyInstance", this.updateGamemodeQueue.get(lobby));

    if (this.lastIndex.get(lobby) === this.updateGamemodeQueue.get(lobby)![this.updateGamemodeQueue.get(lobby)!.length - 1]) {
      this.updateGamemodeRunning.set(lobby, false);
      this.updateGamemodeQueue.set(lobby, []);

      return;
    }

    await this.mods[this.lastIndex.get(lobby)!].onDisable(lobby);

    console.log("[UG] old unloaded");

    this.lastIndex.set(lobby, this.updateGamemodeQueue.get(lobby)!.pop()!);

    this.updateGamemodeQueue.set(lobby, []);

    await this.mods[this.lastIndex.get(lobby)!].onEnable(lobby);

    console.log("[UG] new loaded, queue size", this.updateGamemodeQueue.get(lobby));

    this.updateGamemodeRunning.set(lobby, false);

    if (this.updateGamemodeQueue.get(lobby)!.length > 0) {
      console.log("[UG] recursing");

      await this.updateGamemode(lobby);
    }

    console.log("[UG] exiting");
  }
}
