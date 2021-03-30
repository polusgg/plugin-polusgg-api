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

RootPacket.registerPacket(0x81, ResizePacket.deserialize, (connection, packet) => {
  connection.setMeta({
    displaySize: {
      width: packet.width,
      height: packet.height,
    },
  });
});

RootPacket.registerPacket(0x80, FetchResourceResponsePacket.deserialize, (_connection, _packet) => {
  // do not handle
});

RpcPacket.registerPacket(0x81, ClickPacket.deserialize, (_connection, _packet) => {
  // handle buttons rose!!!
});

export default class PolusGGApi extends BasePlugin {
  private readonly mods: BaseMod[] = [];

  constructor() {
    super({
      name: "Polus.gg API",
      version: [1, 0, 0],
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
