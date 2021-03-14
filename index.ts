import { RootPacket } from "../../../lib/protocol/packets/hazel";
// import { SetCodePacket } from "./packets/rpc/lobbyBehaviour";
import { BasePlugin } from "../../../lib/api/plugin";
import { ResizePacket } from "./packets/root";
import { Server } from "../../../lib/server";
// import { Player } from "../../../lib/player";
import { EntityDeadBody } from "./entities";
import { Lobby } from "../../../lib/lobby";
import { BodyDirection, BodyState, ServiceType } from "./types/enums";
import { Services } from "./services";
// import { ChatVisibilityPacket } from "./packets/rpc/gameData";
import { CloseHudPacket } from "./packets/rpc/playerControl";
import { GameDataPacket, StartGamePacket } from "../../../lib/protocol/packets/root";

declare const server: Server;

RootPacket.registerPacket(0x80, ResizePacket.deserialize, (connection, packet) => {
  connection.setMeta({
    displaySize: {
      width: packet.width,
      height: packet.height,
    },
  });
});

const elloworld = "Leaderboards: 53,060,503 scores set by 922,015 users on 141,658 leaderboards                              ";
// const maxLength = 15;
let i = 0;
let lol = false;

const resource = Services.get(ServiceType.Resource);

export default class extends BasePlugin {
  constructor() {
    super(server, {
      name: "Polus.gg API",
      version: [1, 0, 0],
    });

    server.on("player.joined", event => {
      event.getPlayer().setMeta({
        closeHud: setInterval(() => {
          i = (i + 1) % elloworld.length;
          // event.getLobby().sendRpcPacket(event.getLobby().getLobbyBehaviour()!.getLobbyBehaviour(),
          //   new SetCodePacket(
          //     (elloworld.substring(i) + elloworld.substring(0, i)).substring(0, maxLength),
          //   ),
          // );
          lol = !lol;
        }, 100),
      });
    });

    server.on("player.chat.message", event => {
      const msg = event.getMessage().toString().split(" ");
      const lobby = event.getPlayer().getLobby() as Lobby;

      if (msg[0] == ("/p")) {
        console.log("lol", msg[1]);

        switch (msg[1]) {
          case "die": {
            console.log("no bodies lol");

            const deadBody = new EntityDeadBody(
              lobby,
              [0xFF, 0x00, 0x00, 0xFF],
              [0x00, 0xFF, 0x00, 0xAA],
              BodyState.Falling,
              BodyDirection.FacingLeft,
            );

            lobby.sendRootGamePacket(new GameDataPacket([deadBody.serializeSpawn()], lobby.getCode()), lobby.getConnections());
            break;
          }
          case "fetch":
            if (msg[2].length > 0) {
              resource.load(event.getPlayer().getConnection()!, "submarine.png", Buffer.alloc(16));
              event.getPlayer().sendChat(`Fetching ${msg[2]}`);
              break;
            }
            break;
          case "start":
            lobby.disableActingHosts(false);
            lobby.getHostInstance().startGame();
            lobby.sendRpcPacket(lobby.getLobbyBehaviour()!.getLobbyBehaviour(),
              new CloseHudPacket(
                // lol,
              ),
            );
            break;
          default: event.getPlayer().sendChat("Lol not valid");
        }
      }
    });

    server.on("player.left", event => {
      clearInterval(event.getPlayer().getMeta("closeHud"));
    });
  }
}
