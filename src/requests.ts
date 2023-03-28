import * as http from 'http'
import * as https from 'https'
import * as querystring from 'querystring'

export class API {
    private protocol = 'https'
    private debug = false

    private host!: string
    private path = '/'
    private headers = {
        'accept-encoding': 'gzip, deflate, br',
        'content-type': 'application/json; charset=utf-8',
        'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36',
    }

    private options: {
        host: string,
        path: string,
        headers: { [x: string]: string },
        method: 'GET' | 'POST' | 'DELETE' | 'HEAD' | 'PUT',
        port?: number
    } = {
            host: this.host,
            path: this.path,
            headers: this.headers,
            method: 'GET',
        }

    private payload = {}
    private body = {}
    private bufferBody?: Buffer= undefined

    private response?: http.IncomingMessage | string

    private constructor (args: {
        path: string,
        host?: string,
        port?: number
        forcedHttp?: boolean,
        debug?: boolean,
    }) {
        this.options.host = this.host = args.host ? args.host : 'api.ngrok.evink.cn'
        this.options.path = this.path = args.path ? args.path : '/'
        this.protocol = args.forcedHttp ? 'http' : 'https'
        this.debug = args.debug ? args.debug : false
        if (args.port) this.options.port = args.port
    }

    addHeader (headers: { [x: string]: string }): API {
        this.options.headers = Object.assign(this.headers, headers)
        return this
    }

    addPayload (payload: { [x: string]: any }): API {
        this.payload = Object.assign(this.payload, payload)
        return this
    }

    addBody (body: { [x: string]: any }): API {
        this.body = Object.assign(this.body, body)
        return this
    }

    addBodyFile (file: Buffer) {
        this.bufferBody = file
        return this
    }

    private request<T> (callback?: (data: T, response: http.IncomingMessage) => void): Promise<T> {
        return new Promise((resolve, reject) => {
            if (this.response) return reject(Error('A request already sent... ignored'))
            const api = this.protocol === 'https' ? https : http
            if (Object.keys(this.payload).length !== 0) this.options.path = `${this.path}?${querystring.stringify(this.payload)}`
            // if (this.options.method === 'GET') this.body = {}

            if (this.debug) {
                console.debug('Request options:', this.options)
                console.debug('Request payload:', this.payload)
                console.debug('Request body:', this.body)
            }

            const request = api.request(this.options, (response) => {
                this.response = response
                response.setEncoding('utf-8')
                let data = ''
                response.on('data', (chunk) => {
                    data += chunk
                    if (this.debug) console.debug('Response chunk:', chunk)
                })
                response.on('end', () => {
                    if ('content-type' in response.headers && response.headers['content-type']?.toString().includes('application/json'))
                        data = JSON.parse(data)
                    resolve(data as unknown as T)
                    if (callback) callback(data as unknown as T, response)
                    if (this.debug) console.debug('Response data:', data)
                })
                response.on('error', (err) => {
                    reject(err)
                    console.error('A request to remote server got an error:', err)
                })
            })

            request.on('error', err => reject(err))
            if (this.bufferBody) request.write(this.bufferBody)
            else request.write(JSON.stringify(this.body))
            request.end()
        })
    }

    private static _method (method: API['options']['method'], args: {
        path: string,
        host?: string,
        port?: number
        forcedHttp?: boolean,
        debug?: boolean,
    }): API {
        const api = new API(args)
        api.options.method = method
        return api
    }

    static get (args: {
        path: string,
        host?: string,
        port?: number
        forcedHttp?: boolean,
        debug?: boolean,
    }): API {
        return this._method('GET', args)
    }

    static post (args: {
        path: string,
        host?: string,
        port?: number
        forcedHttp?: boolean,
        debug?: boolean,
    }): API {
        return this._method('POST', args)
    }

    send (callback?: (data: string | { [x: string]: any }, response?: http.IncomingMessage) => void): Promise<string | Record<string, unknown>> {
        return this.request(callback)
    }
}

// API.post({ host: '127.0.0.1', port: 9002, path: '/test/params/body', debug: true, forcedHttp: true }).addBody({
//     name: 'evink', age: 12, birth: new Date(), list: [1, 2], dict: {name: 'EvinK'}
// }).send()