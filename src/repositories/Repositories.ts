import { ConnectionRepository, ConversationRepository, DeviceRepository, MessageRepository, PrivateMessageRepository } from ".";

export class Repositories {
  public connection: ConnectionRepository;
  public conversation: ConversationRepository;
  public device: DeviceRepository;
  public message: MessageRepository;
  public privateMessage: PrivateMessageRepository;

  private static _current: Repositories = null;
  public static getCurrent = () => {
    if (Repositories._current === null) Repositories._current = new Repositories();
    return Repositories._current;
  }

  constructor() {
    this.connection = new ConnectionRepository();
    this.conversation = new ConversationRepository();
    this.device = new DeviceRepository();
    this.message = new MessageRepository();
    this.privateMessage = new PrivateMessageRepository();
  }
}
