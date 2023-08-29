interface Options {
    name?: string;
    channel?: string;
    debug?: boolean;
}

export type MessageCallback = (data: any, confirm: ConfirmationCallback) => void;
export type ConfirmationCallback = (success: boolean, data?: any) => void;

export class CrossFrameMessenger {
    private readonly name: string;
    private readonly targetWindow: Window;
    private readonly targetOrigin: string;
    private readonly channel: string;
    private readonly debug: boolean;
    private listening: boolean = false;
    private callbacks: Map<string, MessageCallback[]> = new Map();
    private pendingConfirmations: Map<string, ConfirmationCallback> = new Map();

    constructor(targetWindow: Window, targetOrigin: string, options: Options = {}) {
        this.targetWindow = targetWindow;
        this.targetOrigin = targetOrigin;
        this.name = options.name || window.document.title;
        this.channel = options.channel ? options.channel + ':' : '';
        this.debug = options.debug || false;

        this._listener = this._listener.bind(this);
        this.listen();
    }

    public listen() {
        if(this.listening) {
            return;
        }
        window.removeEventListener('message', this._listener);
        window.addEventListener('message', this._listener);
        this.listening = true;
        if (this.debug) {
            console.debug(this.name + ' Initialized Listening');
        }
    }

    public stop() {
        window.removeEventListener('message', this._listener);
        this.listening = false;
        if (this.debug) {
            console.debug(this.name + ' Stopped Listening');
        }
    }

    public on(eventTypes: string | string[], callback: MessageCallback) {
        const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
        types.forEach(eventType => {
            const typeWithChannel = this.channel + eventType;
            const currentCallbacks = this.callbacks.get(typeWithChannel) || [];
            currentCallbacks.push(callback);
            this.callbacks.set(typeWithChannel, currentCallbacks);
        });
    }

    public send(eventType: string, data: any = {}, isConfirmation: boolean = false, confirmationId?: string, event?: MessageEvent): void {
        const senderName = isConfirmation ? this.name : event?.data.name || this.name;
        const targetWindow = event?.source as Window || this.targetWindow;
        const targetOrigin = event?.origin || this.targetOrigin;

        const message = {
            type: this.channel + eventType,
            name: senderName,
            data: JSON.stringify(data),
            isConfirmation: isConfirmation,
            confirmationId: confirmationId || (isConfirmation ? undefined : this._generateUniqueId()),
        };

        targetWindow.postMessage(message, targetOrigin);

        if (this.debug) {
            if(isConfirmation) {
                console.debug(senderName + ' Sent ' + (data.success ? 'Success' : 'Failed') + ' Confirmation:', eventType, data, 'To: ' + targetOrigin);
            }else{
                console.debug(senderName + ' Sent:', eventType, data, 'To: ' + targetOrigin);
                if(confirmationId) {
                    console.debug('Waiting confirmation...');
                }
            }
        }
    }

    public sendWithConfirmation(eventType: string, data: any = {}): Promise<unknown> {
        return new Promise((resolve, reject) => {
            this._sendWithConfirmation(eventType, data, (success, data) => {
                if(success) {
                    resolve(data);
                }else{
                    reject(data);
                }
            })
        });
    }

    private _sendWithConfirmation(eventType: string, data: any = {}, confirmationCallback: ConfirmationCallback): void {
        const confirmationId = this._generateUniqueId();
        this.pendingConfirmations.set(confirmationId, confirmationCallback);
        this.send(eventType, data, false, confirmationId);
    }

    private _listener(event: MessageEvent): void {
        if (!event.origin.startsWith(this.targetOrigin)) {
            return;
        }
        if (event.data.type.startsWith(this.channel)) {
            const typeWithoutPrefix = event.data.type.slice(this.channel.length);
            const data = JSON.parse(event.data.data);

            if (event.data.isConfirmation) {
                const callback = this.pendingConfirmations.get(event.data.confirmationId);
                if (callback) {
                    const success = data.success;
                    delete data.success;
                    if (this.debug) {
                        console.debug(this.name + ' Received ' + (success ? 'Success' : 'Failed') + ' Confirmation:', typeWithoutPrefix, data, 'From: ' + event.data.name + ' - ' + event.origin);
                    }
                    callback(success, data);
                    this.pendingConfirmations.delete(event.data.confirmationId);
                }
            } else {
                const callbacks = this.callbacks.get(event.data.type);
                if (callbacks) {
                    if (this.debug) {
                        console.debug(this.name + ' Received:', typeWithoutPrefix, data, 'From: ' + event.data.name + ' - ' + event.origin);
                    }
                    callbacks.forEach(callback => callback(data, (success, confirmationData) => {
                        this.send(typeWithoutPrefix, { success: success, ...confirmationData }, true, event.data.confirmationId, event);
                    }));
                }
            }
        }
    }

    private _generateUniqueId(): string {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
}
