import * as CryptoJS from 'crypto-js';
import fetch, { Response } from 'node-fetch';
import parser from 'fast-xml-parser';
import { IServiceBusClient } from './IServiceBusClient';
import { URL } from 'url';
import { ISubscription } from './models/ISubscriptionDetails';

export default class ServiceBusClient implements IServiceBusClient {

    constructor(private connectionString: string) {
    }

    public async validateAndThrow(): Promise<void> {
        var auth = this.getAuthHeader();

        var result = await fetch(auth.endpoint.replace('sb', 'https'), {
            method: 'GET',
            headers: { 'Authorization': auth.auth },
        });

        var body = await result.text();
    }

    public getTopics(): Promise<any[]> {
        return this.getEntities('GET', '/$resources/topics');
    }

    public getQueues(): Promise<any[]> {
        return this.getEntities('GET', '/$resources/queues');
    }

    public getSubscriptions = (topicName: string): Promise<ISubscription[]> => {
        return this.getEntities('GET', `${topicName}/subscriptions`);
    }

    public getSubscriptionDetails = (topic: string, subscription: string): Promise<ISubscription> => {
        return this.getEntity<ISubscription>('GET', `${topic}/subscriptions/${subscription}`);
    }

    public getMessages = (topic: string, subscription: string): Promise<any[]> => {
        return this.getEntities('POST', `${topic}/subscriptions/${subscription}/messages/head`);
    }

    private async getEntity<T>(method: string, path: string): Promise<T> {
        const result = await this.sendRequest(method, path);
        return result.entry;
    }

    private async getEntities<T>(method: string, path: string): Promise<T[]> {
        const result = await this.sendRequest(method, path);
        if(result.feed.entry){
            if(Array.isArray(result.feed.entry)){
                return result.feed.entry;
            }
            return [result.feed.entry];
        }
        return [];
    }

    private async sendRequest(method: string, path: string): Promise<any> {
        //https://docs.microsoft.com/en-us/rest/api/servicebus/entities-discovery
        var auth = this.getAuthHeader();

        var result = await fetch(auth.endpoint.replace('sb', 'https') + path, {
            method: method || 'GET',
            headers: {
                'Authorization': auth.auth,
                'api-version': '2015-01'
            },
        });

        if (!result.ok) {
            var error = await result.text();
            return Promise.reject(error);
        }

        if (result.status === 204) { //NoResult Stats code
            return null;
        }

        const body = await result.text();
        const contentType = result.headers.get('content-type');

        if (contentType && contentType.includes('json')) {
            return JSON.parse(body);
        }
        else if (contentType && contentType.includes('xml')) {
            //WTF: some responses are actually JSON but content type comes as xml
            try{
                return parser.parse(body);
            }catch{
                try{
                    return JSON.parse(body);
                }
                catch (ex){
                    throw ex;
                }
            }
        }
        else {
            return body;
        }

        // if (xmlData) {
        //     const feed = xmlData.feed;
        //     if (feed) {
        //         if (feed.entry) {
        //             const entry = feed.entry;
        //             if (!Array.isArray(entry)) {
        //                 return Promise.resolve([entry]);
        //             }
        //             else {
        //                 return Promise.resolve(entry);
        //             }
        //         }
        //         else {
        //             return Promise.resolve(feed);
        //         }
        //     }
        //     else {
        //         if (xmlData.entry) {
        //             return Promise.resolve(xmlData.entry);
        //         }
        //         else {
        //             throw new Error("Not implemented");
        //         }
        //     }
        // }
        // else {
        //     return Promise.resolve([]);
        // }
    }


    private getAuthHeader(): any {

        const values: Map<string, string> = this.connectionString.split(';')
            .map(x => x.split('='))
            // .reduce(x=> {x[0]: x[1]}, [])
            .reduce(function (a, b) {
                return a.set(b[0], b[1]);
            }, new Map<string, string>());

        const Endpoint = values.get('Endpoint');
        const SharedAccessKeyName = values.get('SharedAccessKeyName');
        const SharedAccessKey = values.get('SharedAccessKey') + '=';

        if (!Endpoint || !SharedAccessKeyName || !SharedAccessKey) {
            throw new Error(`Invalid connection string ${this.connectionString}`);
        }

        var d = new Date();
        var sinceEpoch = Math.round(d.getTime() / 1000);

        var expiry = (sinceEpoch + 3600);

        var stringToSign = encodeURIComponent(Endpoint) + '\n' + expiry;

        var hash = CryptoJS.HmacSHA256(stringToSign, SharedAccessKey);
        var hashInBase64 = CryptoJS.enc.Base64.stringify(hash);

        var sasToken = 'SharedAccessSignature sr=' + encodeURIComponent(Endpoint) + '&sig=' + encodeURIComponent(hashInBase64) + '&se=' + expiry + '&skn=' + SharedAccessKeyName;

        return { auth: sasToken, endpoint: Endpoint };
    }

    public getHostName(): string {
        let hostName = '';

        try {
            var auth = this.getAuthHeader();
            var loc = new URL(auth.endpoint);
            hostName = loc.hostname.split(".", 1)[0];
        } catch { }

        return hostName;
    }
}

//postman.setEnvironmentVariable('azure-authorization', getAuthHeader(request['url'], "RootManageSharedAccessKey", "fmmVl6GYSXS23qMfkCpUqp6GeWDNy3czEEA0UhjeI+A="));
//postman.setEnvironmentVariable('current-date',new Date().toUTCString());