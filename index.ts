import { format } from "util";
import { RootPacket } from "@nodepolus/framework/src/protocol/packets/hazel";
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
import { ClientVersion, DisconnectReason } from "@nodepolus/framework/src/types";
import { QuickChatPacketType, QuickChatPhrase, QuickChatPlayer, QuickChatSentence, SendQuickChatPacket } from "@nodepolus/framework/src/protocol/packets/rpc/sendQuickChatPacket";

declare global {
  interface Object {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    log(...data: any[]);
  }
}

const SUPPORTED_VERSION = new ClientVersion(2021, 10, 16);

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

      process.stdout.write(format(...data) + "\n");

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

    this.server.on("connection.opened", event => {
      const reader = event.getReader();

      reader.readAllChildMessages(message => {
        switch (message.getTag()) {
          case 0:
            const version = ClientVersion.decode(message.readUInt32());
            if (!version.equals(SUPPORTED_VERSION, false)) {
              event.setDisconnectReason(DisconnectReason.custom("Mod version invalid"))
              event.cancel();

              return;
            }
            break;
          default:
            event.setDisconnectReason(DisconnectReason.error())
            event.cancel();
        }
      });
    });

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

      for (const mod of this.mods) {
        if (mod.getEnabled(event.getGame().getLobby())) {
          mod.assignRoles(event.getGame());
        }
      }
      // const impostorRoleDecls = roles.filter(r => r.assignWith === RoleAlignment.Impostor);
      // const impostorCounts = impostorRoleDecls.reduce((a, r) => a + r.playerCount, 0);

      //
      // if (impostorRoleDecls.length > 0) {
      //   event.setImpostors(shuffleArrayClone(event.getGame().getLobby().getPlayers()).slice(0, RoleManagerService.adjustImpostorCount(event.getGame().getLobby().getPlayers().length)));
      // }
      //
      // event.getImpostors().forEach(p => p.setRole(PlayerRole.Impostor));
    });

    this.server.on("server.lobby.created", async event => {
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
      }, 250);
    });

    this.server.on("game.started", event => {
      setTimeout(() => {
        event.getGame().getLobby().getRealPlayers()
          .forEach(player => {
            Services.get(ServiceType.Hud).updateQrCodeState(player.getSafeConnection());
          });
      }, 100);
    });

    this.server.on("player.chat.message", event => {
      event.cancel();

      Services.get(ServiceType.Chat).broadcastChatMessageFrom(event.getPlayer() as Player, event.getMessage().toString());
    });
    
    this.server.on("player.chat.message.quick", event => {
      event.cancel();
      
      let contentsType = QuickChatPacketType.None;
      const value = event.getMessage();
      if (value instanceof QuickChatPlayer) {
        contentsType = QuickChatPacketType.Player;
      } else if (value instanceof QuickChatSentence) {
        contentsType = QuickChatPacketType.Sentence;
      } else if (value instanceof QuickChatPhrase) {
        contentsType = QuickChatPacketType.Phrase;
      }

      Services.get(ServiceType.Chat).broadcastChatMessageFrom(event.getPlayer() as Player, new SendQuickChatPacket(contentsType, event.getMessage()));
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

    Services.get(ServiceType.Colliders).registerAllColliders();
  }

  registerMod(mod: BaseMod): void {
    this.mods.push(mod);
  }

  async updateGamemode(lobby: LobbyInstance): Promise<void> {
    // console.log("[UG] Called", this.updateGamemodeRunning.get(lobby));

    if (this.updateGamemodeRunning.get(lobby)) {
      return;
    }

    this.updateGamemodeRunning.set(lobby, true);

    // console.log("[UG] onlyInstance", this.updateGamemodeQueue.get(lobby));

    if (this.lastIndex.get(lobby) === this.updateGamemodeQueue.get(lobby)![this.updateGamemodeQueue.get(lobby)!.length - 1]) {
      this.updateGamemodeRunning.set(lobby, false);
      this.updateGamemodeQueue.set(lobby, []);

      return;
    }

    await this.mods[this.lastIndex.get(lobby)!].onDisable(lobby);

    // console.log("[UG] old unloaded");

    this.lastIndex.set(lobby, this.updateGamemodeQueue.get(lobby)!.pop()!);

    this.updateGamemodeQueue.set(lobby, []);

    await this.mods[this.lastIndex.get(lobby)!].onEnable(lobby);

    // console.log("[UG] new loaded, queue size", this.updateGamemodeQueue.get(lobby));

    this.updateGamemodeRunning.set(lobby, false);

    if (this.updateGamemodeQueue.get(lobby)!.length > 0) {
      // console.log("[UG] recursing");

      await this.updateGamemode(lobby);
    }

    // console.log("[UG] exiting");
  }
}
