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
import { EnumValue, SetGameOption } from "./src/packets/root/setGameOption";

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

    RootPacket.registerPacket(0x89, SetGameOption.deserialize, (connection, packet) => {
      // TODO: Do validation on EnumValue
      // const gameOptions = Services.get(ServiceType.GameOptions).getGameOptions(connection.getSafeLobby())
      // const option = gameOptions.getOption(packet.name);
      // const value = option.getValue();

      // if (value instanceof EnumValue) {
      //   value.value = (packet.value as EnumValue).index;
      // }

      Services.get(ServiceType.GameOptions).getGameOptions(connection.getSafeLobby()).setOption(packet.name, packet.value, connection.getLobby()!.getConnections().filter(c => c != connection));
    });

    BaseMod.owner = this;

    this.server.on("game.started", event => {
      const roles = this.mods.filter(mod => mod.getEnabled(event.getGame().getLobby())).map(e => e.getRoles(event.getGame().getLobby())).flat();
      const impostorRoleDecls = roles.filter(r => r.role === Impostor);
      const impostorCounts = impostorRoleDecls.reduce((a, r) => a + r.playerCount, 0);

      event.setImpostors([]);

      if (impostorRoleDecls.length > 0) {
        event.setImpostors(shuffleArrayClone(event.getGame().getLobby().getPlayers()).slice(0, impostorCounts));
      }

      event.getImpostors().forEach(p => p.setRole(PlayerRole.Impostor));

      Services.get(ServiceType.RoleManager).assignRoles(event.getGame(), roles.filter(r => r.role !== Impostor));
    });

    this.server.on("server.lobby.created", event => {
      const options = Services.get(ServiceType.GameOptions).getGameOptions<{ gamemode: EnumValue }>(event.getLobby());

      options.createOption("", "gamemode", {
        index: 0,
        options: this.mods.map(mod => mod.getMetadata().name),
      });

      this.mods[0].onEnable(event.getLobby());

      let lastIndex = 0;

      options.on("option.gamemode.changed", async option => {
        await this.mods[lastIndex].onDisable(event.getLobby());

        lastIndex = option.getValue().index;

        this.mods[lastIndex].onEnable(event.getLobby());
      });
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
