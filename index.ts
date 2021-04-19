import { RootPacket } from "@nodepolus/framework/src/protocol/packets/hazel";
import { shuffleArrayClone } from "@nodepolus/framework/src/util/shuffle";
import { PlayerRole } from "@nodepolus/framework/src/types/enums";
import { BasePlugin } from "@nodepolus/framework/src/api/plugin";
import { RevivePacket } from "./src/packets/rpc/playerControl";
import { Impostor } from "./src/baseRole/impostor/impostor";
import { Player } from "@nodepolus/framework/src/player";
import { FetchResourceResponsePacket, ResizePacket } from "./src/packets/root";
import { ServiceType } from "./src/types/enums";
import { BaseMod } from "./src/baseMod/baseMod";
import { Services } from "./src/services";
import { RpcPacket } from "@nodepolus/framework/src/protocol/packets/gameData";
import { ClickPacket } from "./src/packets/rpc/clickBehaviour";
import { BooleanValue, EnumValue, NumberValue, SetGameOption } from "./src/packets/root/setGameOption";
import { AssetBundle } from "./src/assets";
import { Vector2 } from "@nodepolus/framework/src/types";
import { EdgeAlignments } from "./src/types/enums/edgeAlignment";

export default class PolusGGApi extends BasePlugin {
  private readonly mods: BaseMod[] = [];

  constructor() {
    super({
      name: "Polus.gg API",
      version: [1, 0, 0],
    });

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

    RpcPacket.registerPacket(0x86, ClickPacket.deserialize, () => {
      // Handled in ICB INO
    });

    RootPacket.registerPacket(0x89, SetGameOption.deserialize, (connection, packet) => {
      // TODO: Do validation on EnumValue
      // const gameOptions = Services.get(ServiceType.GameOptions).getGameOptions(connection.getSafeLobby())
      // const option = gameOptions.getOption(packet.name);
      // const value = option.getValue();

      // if (value instanceof EnumValue) {
      //   value.value = (packet.value as EnumValue).index;
      // }

      Services.get(ServiceType.GameOptions).getGameOptions(connection.getSafeLobby()).setOption(packet.name, packet.value);
    });

    BaseMod.owner = this;

    this.server.on("game.started", event => {
      const roles = this.mods.filter(mod => mod.getEnabled(event.getGame().getLobby())).map(e => e.getRoles(event.getGame().getLobby())).flat();
      const impostorRoleDecls = roles.filter(r => r.role === Impostor);
      const impostorCounts = impostorRoleDecls.reduce((a, r) => a + r.playerCount, 0);

      console.log(roles);

      if (impostorRoleDecls.length > 0) {
        event.setImpostors(shuffleArrayClone(event.getGame().getLobby().getPlayers()).slice(0, impostorCounts));
      }

      event.getImpostors().forEach(p => p.setRole(PlayerRole.Impostor));

      Services.get(ServiceType.RoleManager).assignRoles(event.getGame(), roles.filter(r => r.role !== Impostor));
    });

    this.server.on("server.lobby.created", event => {
      const options = Services.get(ServiceType.GameOptions).getGameOptions<{ gamemode: EnumValue }>(event.getLobby());

      options.createOption("gamemode", {
        index: 0,
        options: this.mods.map(mod => mod.getMetadata().name),
      });

      this.mods[0].onEnable(event.getLobby());

      let lastIndex = 0;

      options.on("option.gamemode.changed", option => {
        this.mods[lastIndex].onDisable(event.getLobby());

        lastIndex = option.getValue().index;

        this.mods[lastIndex].onEnable(event.getLobby());
      });
    });

    this.server.on("player.chat.message", event => {
      if (event.getMessage().toString().toLowerCase()
        .trim() === "/butt") {
        AssetBundle.load("TownOfPolus").then(_ => {
          this.server.getLogger().info("TownOfPolus Bundle loaded.");
          Services.get(ServiceType.Button).spawnButton(event.getPlayer().getSafeConnection(), {
            asset: AssetBundle.loadSafeFromCache("TownOfPolus").getSafeAsset("Assets/Mods/TownOfPolus/Fix.png"),
            maxTimer: event.getPlayer().getLobby().getOptions()
              .getKillCooldown(),
            position: new Vector2(2.1, 0.7),
            alignment: EdgeAlignments.RightBottom,
            currentTime: 10,
            isCountingDown: true,
          }).then(button => {
            button.on("clicked", () => {
              this.server.getLogger().info("Click recieved");
            });
          });
        });
      }

      if (event.getMessage().toString().toLowerCase()
        .trim() == "/gol") {
        const gameOptionsSet = Services.get(ServiceType.GameOptions).getGameOptions(event.getPlayer().getLobby());

        gameOptionsSet.createOption("number-1", new NumberValue(1, 1, 0, 5, false, "{0}"));
        gameOptionsSet.createOption("number-2", new NumberValue(1, 1, 0, 5, false, "{0}"));
        gameOptionsSet.createOption("number-20", new NumberValue(1, 1, 0, 5, false, "{0}"));
        gameOptionsSet.createOption("boolean-true", new BooleanValue(true));
        gameOptionsSet.createOption("boolean-false", new BooleanValue(false));
        gameOptionsSet.createOption("enum-0", new EnumValue(1, ["Index0", "Index1", "Index2"]));
      }

      if (event.getMessage().toString().toLowerCase()
        .trim()
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        .split(" ")[0] == "/dgo" && event.getMessage().toString().toLowerCase()
        .trim()
        .split(" ")[1] !== undefined) {
        Services.get(ServiceType.GameOptions).getGameOptions(event.getPlayer().getLobby()).deleteOption(event.getMessage().toString().toLowerCase()
          .trim()
          .split(" ")[1]);
      }
    });

    Player.prototype.revive = async function revive(this: Player): Promise<void> {
      this.getGameDataEntry().setDead(false);
      this.updateGameData();
      this.getEntity().getPlayerControl().sendRpcPacket(new RevivePacket(), this.getLobby().getConnections());

      return new Promise(r => r());
    };
  }

  registerMod(mod: BaseMod): void {
    this.mods.push(mod);
  }
}
