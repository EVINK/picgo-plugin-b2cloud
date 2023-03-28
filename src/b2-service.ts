import { API } from './requests'

import * as crypto from 'crypto'
import * as fs from 'fs'
import { IPicGo } from 'picgo'
import { Cache } from './cache'

function sha1File (filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha1')
        const stream = fs.createReadStream(filePath)
        stream.on('error', reject)
        stream.on('data', chunk => hash.update(chunk))
        stream.on('end', () => resolve(hash.digest('hex')))
    })
}

export class B2 {
    public static ctx: IPicGo = {} as IPicGo

    public static b2Secrets = {
        keyId: '',
        applicationKey: '',
        bucketId: ''
    }

    public static async getAuthorizationToken (): Promise<{ 'apiUrl': string, 'authorizationToken': string }> {
        const b2RedisKey = 'b2:authToken:json'

        const data: string | undefined | Record<string, unknown> = Cache.get(b2RedisKey)
        if (data) return JSON.parse(data)

        let authStr = this.b2Secrets.keyId + ':' + this.b2Secrets.applicationKey
        authStr = 'Basic ' + Buffer.from(authStr, 'utf-8').toString('base64')

        const response = await API.get({
            host: 'api.backblazeb2.com',
            path: '/b2api/v2/b2_authorize_account',
            debug: true,
        }).addHeader({
            Authorization: authStr
        }).send() as Record<string, unknown>

        if (!('apiUrl' in response)) throw new Error('No B2 API Url found!')

        return {
            apiUrl: response.apiUrl as string,
            authorizationToken: response.authorizationToken as string
        }
    }

    public static async getUploadUrl (): Promise<{
        authorizationToken: string,
        bucketId: string,
        uploadUrl: string,
    }> {
        const b2RedisKey = 'b2:uploadUrl:json'
        const d = Cache.get(b2RedisKey)
        if (d) return JSON.parse(d)

        const data = await this.getAuthorizationToken()
        let idx = data.apiUrl.lastIndexOf('/')
        if (idx !== -1) idx += 1
        data.apiUrl = data.apiUrl.substring(idx)

        const response = await API.post({
            host: data.apiUrl,
            path: '/b2api/v2/b2_get_upload_url',
            debug: true,
        }).addHeader({
            Authorization: data.authorizationToken
        }).addBody({
            bucketId: this.b2Secrets.bucketId
        }).send() as unknown as Promise<Record<string, unknown>>

        // this.ctx.emit('notification', {
        //     title: 'DEBUG:'+response
        // })

        if (!('uploadUrl' in response)) throw new Error('No uploadUrl found')

        Cache.set(b2RedisKey, JSON.stringify(response))
        Cache.expires(b2RedisKey, 3600 * 12)

        return response as unknown as {
            authorizationToken: string,
            bucketId: string,
            uploadUrl: string,
        }
    }

    public static async upload2B2 (args: {
        filePath: string,
        prefix: string,
        fileName: string,
        fileSize: number,
        fileBuffer: Buffer
    }):Promise<string> {
        const uploadUrl = await this.getUploadUrl()
        const b2Sha1 = await sha1File(args.filePath)
        let host = uploadUrl.uploadUrl.slice('https://'.length)
        const path = host.substring(host.indexOf('/'))
        host = host.substring(0, host.indexOf('/'))
        this.ctx.emit('notification', {
            title: 'DEBUG:uploadUrl:'+uploadUrl.uploadUrl
        })
        this.ctx.emit('notification', {
            title: 'DEBUG:host:'+host
        })
        this.ctx.emit('notification', {
            title: 'DEBUG:path:'+path
        })

        const response = await API.post({
            host,
            path,
            debug: true,
        }).addHeader({
            Authorization: uploadUrl.authorizationToken,
            'X-Bz-File-Name': encodeURIComponent(args.prefix + args.fileName),
            'Content-Type': 'b2/x-auto; charset=utf-8',
            'Content-Length': (args.fileSize + 40).toString(),
            'X-Bz-Content-Sha1': b2Sha1,
        }).addBodyFile(
            fs.readFileSync(args.filePath),
        ).send() as Record<string, unknown>

        if (!('fileName' in response)) throw new Error('No fileName found')
        return response['fileName'] as string
    }

}