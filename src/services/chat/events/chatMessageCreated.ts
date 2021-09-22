import { CancellableEvent } from "@nodepolus/framework/src/api/events/types";
import { Player } from "@nodepolus/framework/src/player";
import { SendQuickChatPacket } from "@nodepolus/framework/src/protocol/packets/rpc";

export class ChatMessageCreated extends CancellableEvent {
    constructor(
        protected sender: Player,
        protected messageUuid: string,
        protected message: string | SendQuickChatPacket
    ) {
        super();
    }

    getSender() {
        return this.sender;
    }

    setSender(sender: Player) {
        this.sender = sender;
    }

    getUuid() {
        return this.messageUuid;
    }

    setUuid(uuid: string) {
        this.messageUuid = uuid;
    }

    getMessage() {
        return this.message;
    }

    setMessage(message: string) {
        this.message = message;
    }
}