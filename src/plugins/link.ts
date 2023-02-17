import {URL} from 'url';
import {validate as uuidvalidate, v4 as uuidv4} from 'uuid';
import {Plugin, PluginOptions, PluginClass} from './BasePlugin';

export class CoveoLinkParam {
    public static readonly cvo_cid: string = 'cvo_id'; // name of the url parameter
    private static readonly expirationTime: number = 5; // expirationTime in secs
    private _clientId: string; //uuid
    private _creationDate: number; //seconds since epoch to save space in serialized param

    constructor(clientId: string, timestamp?: number) {
        if (!uuidvalidate(clientId)) throw Error('Not a valid uuid');
        this._clientId = clientId;
        this._creationDate = Math.floor((timestamp || Date.now()) / 1000);
    }

    public toString(): string {
        // strips the dashes and uses second granularity to save on url length.
        return this.clientId.replace(/-/g, '') + '.' + this.creationDate.toString();
    }

    public get clientId(): string {
        return this._clientId;
    }

    public get creationDate(): number {
        return this._creationDate;
    }

    public get expired(): boolean {
        const age = Math.floor(Date.now() / 1000) - this.creationDate;
        return age < 0 || age > CoveoLinkParam.expirationTime;
    }

    public static fromString(input: string): CoveoLinkParam | null {
        const parts = input.split('.');
        if (parts.length === 2) {
            const clientIdPart = parts[0];
            const creationDate = parts[1];
            if (clientIdPart.length === 32 && !isNaN(parseInt(creationDate))) {
                const clientId =
                    clientIdPart.substring(0, 8) +
                    '-' +
                    clientIdPart.substring(8, 12) +
                    '-' +
                    clientIdPart.substring(12, 16) +
                    '-' +
                    clientIdPart.substring(16, 20) +
                    '-' +
                    clientIdPart.substring(20, 32);
                if (uuidvalidate(clientId)) {
                    return new CoveoLinkParam(clientId, Number.parseInt(creationDate) * 1000);
                }
            }
        }
        return null;
    }
}

export class LinkPlugin extends Plugin {
    public static readonly Id = 'link';

    constructor({client, uuidGenerator = uuidv4}: PluginOptions) {
        super({client, uuidGenerator});
    }

    public getApi(name: string): Function | null {
        switch (name) {
            case 'decorate':
                return this.decorate;
            case 'acceptFrom':
                return this.acceptFrom;
            default:
                return null;
        }
    }

    public async decorate(urlString: string): Promise<string> {
        // Note: clientId retrieval function is marked as optional
        if (!this.client.getCurrentVisitorId) {
            throw new Error('Could not retrieve current clientId');
        }
        try {
            const url = new URL(urlString);
            const clientId: string = await this.client.getCurrentVisitorId!();
            url.searchParams.set(CoveoLinkParam.cvo_cid, new CoveoLinkParam(clientId).toString());
            return url.toString();
        } catch (error) {
            throw new Error('Invalid URL provided');
        }
    }

    public acceptFrom(acceptedReferrers: string[]) {
        this.client.setAcceptedLinkReferrers!(acceptedReferrers);
    }
}

export const Link: PluginClass = LinkPlugin;
