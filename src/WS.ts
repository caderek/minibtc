import { delay } from "./helpers";

type Message = any;

const status = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

type Setup = {
  initialMessages: Message[];
  messageHandler: (data: Message) => void;
  ping?: {
    message: Message;
    isPong: (data: Message) => boolean;
    waitTime: number;
  };
  heartbeatMaxTime?: number;
  loadingStartAction?: () => void;
  loadingEndAction?: () => void;
};

const isLocalhost = location.hostname === "localhost";

class WS {
  #url: string;
  #setup: Setup;
  #socket!: WebSocket;
  #connection!: Promise<void>;
  #lastHeartbeat: number = Date.now();
  #pong = false;
  #waitingForPong = false;

  constructor(url: string, setup: Setup) {
    this.#url = url;
    this.#setup = setup;
    this.#connect();
    this.#maintainConnection();
  }

  #log(message: string) {
    if (!isLocalhost) {
      return;
    }

    console.log(message, this.#url);
  }

  async #connect() {
    if (this.#setup.loadingStartAction) {
      this.#setup.loadingStartAction();
    }

    this.#socket = new WebSocket(this.#url);
    this.#connection = new Promise((resolve, reject) => {
      this.#socket.addEventListener("open", () => resolve());
      this.#socket.addEventListener("error", () => reject());
    });

    try {
      await this.#connection;
      this.#log("Connected.");

      if (this.#setup.loadingEndAction) {
        this.#setup.loadingEndAction();
      }
    } catch (e) {
      this.#log("Connection error!");
      await delay(1000);
      await this.#closeConnection();
      await this.#connect();
      return;
    }

    this.#socket.addEventListener("error", async () => {
      this.#log("Connection error!");
      await delay(1000);
      await this.#closeConnection();
      await this.#connect();
    });

    for (const message of this.#setup.initialMessages) {
      this.#socket.send(JSON.stringify(message));
    }

    this.#socket.addEventListener("message", (event) => {
      this.#lastHeartbeat = Date.now();

      const data = JSON.parse(event.data) as Message;

      if (
        this.#waitingForPong &&
        this.#setup.ping &&
        this.#setup.ping.isPong(data)
      ) {
        this.#pong = true;
        return;
      }

      this.#setup.messageHandler(data);
    });
  }

  async #closeConnection() {
    this.#log("Closing connection...");

    if (this.#socket.readyState === status.CLOSED) {
      this.#log("Already closed.");
      return;
    }

    return new Promise((resolve) => {
      this.#socket.addEventListener("close", () => {
        this.#log("One-time close hander");
        resolve(null);
      });

      if (this.#socket.readyState === status.CLOSING) {
        this.#log("Already closing.");
      } else {
        this.#log("Closing manually.");
        this.#socket.close();
      }
    });
  }

  async #maintainConnection() {
    window.addEventListener("focus", async () => {
      if (!this.#socket) {
        return;
      }

      if (this.#setup.ping) {
        this.#socket.send(JSON.stringify(this.#setup.ping.message));
        this.#waitingForPong = true;
        await delay(this.#setup.ping.waitTime);
        this.#waitingForPong = false;

        if (this.#pong) {
          this.#log("Connection ok.");
          this.#pong = false;
          return;
        }

        await this.#closeConnection();

        this.#log("Reconnecting...");

        await this.#connect();

        return;
      }

      if (this.#setup.heartbeatMaxTime !== undefined) {
        const msSinceLastHeartbeat = Date.now() - this.#lastHeartbeat;

        if (msSinceLastHeartbeat <= this.#setup.heartbeatMaxTime) {
          this.#log("Connection ok.");
          return;
        }

        this.#log(
          `Last heartbeat older than ${
            this.#setup.heartbeatMaxTime
          }ms. Reconnecting.`
        );

        await this.#closeConnection();

        this.#log("Reconnecting...");

        await this.#connect();

        return;
      }
    });
  }
}

export default WS;
