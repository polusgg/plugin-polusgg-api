import { Lobby } from "@nodepolus/framework/src/lobby";
import { Palette } from "@nodepolus/framework/src/static";
import { randomUUID } from "crypto";
import { DeleteChatMessagePacket } from "../../packets/root/deleteChatMessage";
import { ChatMessageAlign, SetChatMessagePacket } from "../../packets/root/setChatMessage";
import { Color } from "@nodepolus/framework/src/types";
import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { SendQuickChatPacket } from "@nodepolus/framework/src/protocol/packets/rpc";

export interface ChatMessageData {
    sender: PlayerInstance;
    uuid: string;
    message: string | SendQuickChatPacket;
}

export class ChatService {
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
        const cachedMessages = player.getMeta<ChatMessageData[]|undefined>("pgg.chatMessages");
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

    async createChatMessageFor(receiver: PlayerInstance, messageUuid: string, align: ChatMessageAlign, sender: PlayerInstance, message: string | SendQuickChatPacket, pitch?: number | null) {
        const color = Palette.playerBody(sender.getColor());

        // actually log the chat message here I think
        // unless you want a generalised method which implements
        // all of the parameters in the SetChatMessagePacket
        // instead of abstracting it to a player

        const messages = this.getMessagesByPlayer(sender);
        messages.push({
            uuid: messageUuid,
            sender,
            message
        });

        await receiver.getConnection()?.sendReliable([
            new SetChatMessagePacket(
                messageUuid,
                align,
                sender.getName().toString(),
                sender.isDead(),
                false, //todo set whether voted
                sender.getHat(),
                sender.getPet(),
                sender.getSkin(),
                color.dark as Color,
                color.light as Color,
                //todo: set pitch to null when receiver == sender (do this elsewhere when reimplementing chat fully)
                pitch === null ? -1000 : pitch ?? 0.5 + sender.getId() / 15,
                message,
            )
        ]);
    }

    async sendChatFromTo(sender: PlayerInstance, receiver: PlayerInstance, message: string | SendQuickChatPacket) {
        const senderIsDead = sender.getMeta<boolean|undefined>("pgg.countAsDead") || sender.isDead();
        const receiverIsDead = receiver.getMeta<boolean|undefined>("pgg.countAsDead") || receiver.isDead();

        if (senderIsDead && !receiverIsDead) {
            return;
        }

        const messageUuid = randomUUID();

        await this.createChatMessageFor(
            receiver,
            messageUuid,
            sender === receiver ? ChatMessageAlign.Right : ChatMessageAlign.Left,
            sender,
            message
        );
    }

    async broadcastChatMessageFrom(sender: PlayerInstance, message: string | SendQuickChatPacket) {
        const promises: Promise<void>[] = [];
        for (const player of sender.getLobby().getPlayers()) {

            const connection = player.getConnection();
            if (!connection)
                continue;

            promises.push(this.sendChatFromTo(sender, player, message));
        }

        await Promise.all(promises);
    }
}
