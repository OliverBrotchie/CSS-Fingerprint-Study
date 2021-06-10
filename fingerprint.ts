/**
 * Fingerprinted infomation template.
 *
 * @prop {Map<string,string>} properties: a map of device characteristics.
 * @prop {Set<string>} fonts: the set of all fonts not present on the device.
 * @prop {Header} headers: the http headers of the original request.
 */
export class Fingerprint {
    properties: Map<string, string>;
    fonts: Set<string>;
    headers?: Headers;

    constructor() {
        this.properties = new Map();
        this.fonts = new Set();
    }
    /**
     * Gets the fonts stored on the device.
     * Every font not installed on device will send a request to the server, and,
     * by comparing differences between the requests and the full list of fonts, we can draw conclusions about what fonts are installed.
     *
     * @param {Set<string> | Array<string>} fullList: the full list of fonts to compare against.
     */
    calculateFonts(fullList: Set<string> | Array<string>): void {
        this.fonts = new Set(
            [...fullList].filter((e) => {
                return !this.fonts.has(e);
            })
        );
    }

    toJSON(): string {
        return JSON.stringify({
            properties: [...(this?.properties ?? [])],
            fonts: [...(this?.fonts ?? [])],
            headers: [...(this?.headers ?? [])],
        });
    }
}

/**
 * A record of a spesific device.
 *
 * @prop {number | Array<number>} time: the epoch timestamp of the original request.
 * @prop {Fingerprint} fingerprint: captured device fingerprint infomation
 */
export class DeviceRecord {
    timestamp: number;
    customProperties: Map<any, any>;
    fingerprint: Fingerprint;

    /**
     * Creates a new record object.
     *
     */
    constructor() {
        this.fingerprint = new Fingerprint();
        this.timestamp = new Date().getTime();
        this.customProperties = new Map();
    }

    insert(
        key: string,
        value: string | Array<any>,
        headers?: Headers
    ): DeviceRecord {
        switch (key) {
            case "font-name":
                this.fingerprint.fonts.add(value as string);
                break;
            case "custom":
                try {
                    this.customProperties.set(value[0], [1]);
                } catch (_e) {
                    throw new Error(
                        "Custom property values are input as an arrray: ['someKey','someValue']"
                    );
                }

                break;
            default:
                this.fingerprint.properties.set(key, value as string);
        }
        if (headers) this.fingerprint.headers = headers;

        return this;
    }
}

/**
 * The callback function to be run when charecteristics from a device have been collected.
 *
 * @param {string} ip: the ip that the requests were sent from.
 * @param {DeviceRecord} record: the record of the devices, eg: characteristics, headers, ect.
 *
 */
export interface Callback {
    (ip: string, record: DeviceRecord): void;
}

/**
 * A set of options
 *
 * @param {boolean|promise<boolean>} timeoutFunction: a function that checks for a certain condition.
 * If it is true, the device record will be passed onto the callback function, if it is false, it will wait the amount
 * of time spesified by timeout.
 * @param {number} timeout: the interval running the timeout function
 */
export interface Options {
    timeoutFunction: (record: DeviceRecord) => boolean | Promise<boolean>;
    timeout?: number;
}

/**
 * The connection-handler collates incomming requests and runs a given callback function after a spesified timeout period.
 *
 * @prop {Options} options: a set of options to be used by the connection handler.
 * @method insert: Insert infomation about a connection.
 */
export class ConnectionHandler {
    private data: Map<string, DeviceRecord>;
    private callback: Callback;
    options: Options;

    /**
     * Creates a new connection handler.
     *
     * @param {Callback} callback: the callback function to be run.
     * @param {Options} options: (optional) a set of options.
     */
    constructor(callback: Callback, options?: Options) {
        // Merge options with default options
        this.options = Object.assign(
            {
                timeoutFunction: () => true,
                timeout: 10000,
            },
            options
        );
        this.callback = callback;
        this.data = new Map<string, DeviceRecord>();
    }

    /**
     * Insert infomation about a connection.
     *
     * @param {string} ip: the ip of the conenction.
     * @param {string} key: the property to be set. Use "custom" to set a custom property in the DeviceRecord
     * @param {string|Array<any>} value: the value to be set.
     * When using a custom property, replace value with an array of signature: [key,value]
     * @param {number} time: (optional) the epoch time of the request.
     * @param {Headers} headers: (optional) the HTTP headers of the request.
     */
    insert(
        ip: string,
        key: string,
        value: string | Array<any>,
        headers?: Headers
    ): void {
        const record = this.data.get(ip);

        // if the record does not exist
        if (!record) {
            // Create a new record of this device
            this.data.set(ip, new DeviceRecord().insert(key, value, headers));

            // Complex async timeout testing
            new Promise((resolve) => {
                // Call timeoutFunction every spesified timeout
                const inter = setInterval(async () => {
                    if (
                        (await this.options.timeoutFunction(
                            this.data.get(ip) as DeviceRecord
                        )) == true
                    ) {
                        clearInterval(inter);
                        resolve(undefined);
                    }
                }, this.options.timeout);
            }).then(() => {
                this.callback(ip, this.data.get(ip) as DeviceRecord);
                this.data.delete(ip);
            });
        } else {
            record.insert(key, value, headers);
        }
    }
}

/**
 * Stub.
 */
export function calculateEntropy(): number {
    return 0;
}
