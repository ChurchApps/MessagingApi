import { ConnectionRepository, ConversationRepository, MessageRepository } from ".";

export class Repositories {
    public connection: ConnectionRepository;
    public conversation: ConversationRepository;
    public message: MessageRepository;

    private static _current: Repositories = null;
    public static getCurrent = () => {
        if (Repositories._current === null) Repositories._current = new Repositories();
        return Repositories._current;
    }

    constructor() {
        this.connection = new ConnectionRepository();
        this.conversation = new ConversationRepository();
        this.message = new MessageRepository();
    }
}
