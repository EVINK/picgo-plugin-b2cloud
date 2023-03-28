import fs from 'fs'
import tmp from 'tmp'

import { IImgInfo, IPicGo } from 'picgo'
import { IPluginConfig } from 'picgo/dist/utils/interfaces'

import { B2 } from './b2-service'

const config = (ctx: IPicGo): IPluginConfig[] => {
    const userConfig = ctx.getConfig<B2CloudConfig>('picBed.b2cloud-uploader') ||
  {
      accountId: '',
      applicationKey: '',
      bucketId: '',
      domain: '',
      path: '',
      imageProcess: ''
  }
    return [
        {
            name: 'accountId',
            type: 'input',
            alias: 'KeyId',
            default: userConfig.accountId || '',
            message: '',
            required: true
        },
        {
            name: 'applicationKey',
            type: 'input',
            alias: 'ApplicationKey',
            default: userConfig.applicationKey || '',
            message: '',
            required: true
        },
        {
            name: 'bucketId',
            type: 'input',
            alias: 'BucketId',
            default: userConfig.bucketId || '',
            message: '请注意，应填写BucketId而不是Bucket名称',
            required: true
        },
        {
            name: 'path',
            type: 'input',
            alias: '云文件夹',
            message: '指定Bucket中存储的路径，例如: img/',
            default: userConfig.path || '',
            required: false
        },
        {
            name: 'domain',
            type: 'input',
            alias: '访问前缀',
            message: 'https://f004.backblazeb2.com/file/<bucket_name>/ 或 https://<your_bucket_name>.s3.us-west-004.backblazeb2.com/。若不提供此项，则不自动返回图片地址。',
            default: userConfig.domain || '',
            required: false
        },
        {
            name: 'imageProcess',
            type: 'input',
            alias: '图片预处理',
            message: '若使用了图片预处理，可在此添加后缀：如?w=200&h=200&func=crop',
            default: userConfig.imageProcess || '',
            required: false
        }

    ]
}

async function upload (configs: B2CloudConfig, img: IImgInfo, ctx: IPicGo) {
    const tmpObj = tmp.fileSync()
    const path = tmpObj.name
    fs.appendFileSync(path, img.buffer!)

    // 为使用户变更即时生效，每次上传覆盖实例
    B2.b2Secrets = {
        keyId: configs.accountId,
        applicationKey: configs.applicationKey,
        bucketId: configs.bucketId
    }
    const prefix = configs.path ? configs.path : ''

    try {
        const fileName = await B2.upload2B2({
            filePath: path,
            prefix,
            fileName: img.fileName!,
            fileSize: img.buffer!.length,
            fileBuffer: img.buffer!,
        })
        return fileName
    } catch (e) {
        ctx.emit('notification', {
            title: 'Error:' + e,
            body: e
        })
        throw e
    }
}

async function handle (ctx: IPicGo) {
    const configs = ctx.getConfig<B2CloudConfig>('picBed.b2cloud-uploader')
    if (!configs) {
        throw new Error('找不到B2Cloud的配置文件')
    }

    B2.b2Secrets = {
        keyId: configs.accountId,
        applicationKey: configs.applicationKey,
        bucketId: configs.bucketId
    }
    B2.ctx = ctx

    const images = ctx.output
    const promises = []
    for (const img of images) {
        if (!img.buffer || !img.fileName) throw Error('Bug: Not image buffer found.')
        promises.push(upload(configs, img, ctx))
    }
    const results = await Promise.all(promises).catch(e=>e)

    if (results instanceof Error) {
        ctx.emit('notification', {
            title: '上传到B2失败:' + results
        })
        return ctx
    }
    let i = 0
    for (const result of results) {
        images[i].imgUrl = `${configs.domain}/${result}${configs.imageProcess}`
        ctx.emit('notification', {
            title: `B2上传完成: ${result}`,
            body: result
        })
        i++
    }
    return ctx
}

export = (ctx: IPicGo) => {
    const register = () => {
        ctx.helper.uploader.register('b2cloud-uploader', {
            handle,
            name: 'B2Cloud',
            config
        })
    }
    return {
        uploader: 'b2cloud-uploader',
        register
    }
}

