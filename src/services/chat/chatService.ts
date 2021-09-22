import { Lobby } from "@nodepolus/framework/src/lobby";
import { Palette } from "@nodepolus/framework/src/static";
import { randomUUID } from "crypto";
import { DeleteChatMessagePacket } from "../../packets/root/deleteChatMessage";
import { ChatMessageAlign, SetChatMessagePacket } from "../../packets/root/setChatMessage";
import { Color } from "@nodepolus/framework/src/types";
import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { SendQuickChatPacket } from "@nodepolus/framework/src/protocol/packets/rpc";
import Emittery from "emittery";
import { ChatMessageCreated } from "./events/chatMessageCreated";
import { Player } from "@nodepolus/framework/src/player";

export interface ChatMessageData {
  sender: PlayerInstance;
  uuid: string;
  message: string | SendQuickChatPacket;
}

export class ChatService extends Emittery<{
  chatCreated: ChatMessageCreated
}> {
  async deleteMessageFor(receiver: PlayerInstance, uuid: string) {
    receiver.getConnection()?.sendReliable([new DeleteChatMessagePacket(uuid)]);
  }

  async deleteMessagesByPlayer(sender: PlayerInstance) {
    const messages = this.getMessagesByPlayer(sender);

    const promises: Promise<void>[] = [];
    for (const player of sender.getLobby().getPlayers()) {

      const connection = player.getConnection();
      if (!connection)
        continue;

      const deleteMessage = player.getConnection()?.sendReliable([
        ...messages.map(msg => new DeleteChatMessagePacket(msg.uuid))
      ]);

      if (deleteMessage) {
        promises.push(deleteMessage);
      }
    }

    await Promise.all(promises);
  }

  async deleteMessage(lobby: Lobby, uuid: string) {
    const promises: Promise<void>[] = [];
    for (const player of lobby.getPlayers()) {

      const connection = player.getConnection();
      if (!connection)
        continue;

      promises.push(this.deleteMessageFor(player, uuid));
    }
    await Promise.all(promises);
  }

  getMessagesByPlayer(player: PlayerInstance) {
    const cachedMessages = player.getMeta<ChatMessageData[] | undefined>("pgg.chatMessages");
    const messages = cachedMessages || [];
    if (!cachedMessages) {
      player.setMeta("pgg.chatMessages", messages);
    }
    return messages;
  }

  getAllMessagesInLobby(lobby: Lobby) {
    const messages: ChatMessageData[] = [];
    for (const player of lobby.getPlayers()) {
      messages.push(...this.getMessagesByPlayer(player));
    }
    return messages;
  }

  async broadcastChatMessageFrom(sender: PlayerInstance, message: string | SendQuickChatPacket) {
    const messageUuid = randomUUID();

    const event = new ChatMessageCreated(
      sender as Player,
      messageUuid,
      message
    );

    await this.emit("chatCreated", event);

    if (event.isCancelled()) {
      return;
    }

    const messages = this.getMessagesByPlayer(sender);
    messages.push({
      uuid: messageUuid,
      sender,
      message
    });
    
    const color = Palette.playerBody(sender.getColor());

    const promises: Promise<void>[] = [];
    for (const player of sender.getLobby().getPlayers()) {

      const connection = player.getConnection();
      if (!connection)
        continue;

      const senderIsDead = sender.getMeta<boolean | undefined>("pgg.countAsDead") || sender.isDead();
      const receiverIsDead = player.getMeta<boolean | undefined>("pgg.countAsDead") || player.isDead();

      if (senderIsDead && !receiverIsDead) {
        continue;
      }

      promises.push(connection.sendReliable([
        new SetChatMessagePacket(
          messageUuid,
          player === sender ? ChatMessageAlign.Right : ChatMessageAlign.Left,
          sender.getName().toString(),
          senderIsDead,
          false, //todo set whether voted
          sender.getHat(),
          sender.getPet(),
          sender.getSkin(),
          color.dark as Color,
          color.light as Color,
          Palette.playerVisor() as Color,
          sender === player ? -1000 : 0.5 + sender.getId() / 15,
          message
        )
      ]));
    }

    await Promise.all(promises);
  }
}
