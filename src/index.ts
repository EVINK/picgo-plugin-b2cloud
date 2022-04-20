import fs from 'fs'
import tmp from 'tmp'

import { IImgInfo, IPicGo } from 'picgo'
import { IPluginConfig } from 'picgo/dist/utils/interfaces'

import b2CloudStorage from 'b2-cloud-storage'

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
            type: 'password',
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

let b2 : b2CloudStorage

function upload (configs: B2CloudConfig, img: IImgInfo) {
    return new Promise<string>((resolve, reject) => {

        const tmpObj = tmp.fileSync()
        const path = tmpObj.name
        fs.appendFileSync(path, img.buffer!)
        delete img.buffer

        // 为使用户变更即时生效，每次上传覆盖实例
        b2 = new b2CloudStorage({
            auth: {
                accountId: configs.accountId,
                applicationKey: configs.applicationKey
            }
        })

        b2.authorize((err) => {
            if (err) { return reject(Error(`B2 Auth error: ${err}`)) }
            b2.uploadFile(tmpObj.name, {
                bucketId: configs.bucketId,
                fileName: `${configs.path ? configs.path: ''}${img.fileName!}`,
            }, (err, results) => {
                tmpObj.removeCallback()
                if (err) return reject(Error(`Upload to B2Cloud Failed: ${err}`))
                resolve(results.fileName)
            })
        })
    })
}

function handle (ctx: IPicGo) {
    const configs = ctx.getConfig<B2CloudConfig>('picBed.b2cloud-uploader')
    if (!configs) {
        throw new Error('找不到B2Cloud的配置文件')
    }
    try {
        const images = ctx.output
        images.forEach(img => {
            if (!img.buffer || !img.fileName) throw Error('Bug: Not image buffer found.')
            // await upload(configs, img)
            upload(configs, img)
                .then((fileName: string) => {
                    // 异步会导致PicGo无法获取imgUrl
                    // img.imgUrl = `${configs.domain}/${configs.path ? configs.path : '/'}${fileName}${configs.imageProcess}`
                    ctx.emit('notification', {
                        title: `B2上传完成: ${img.fileName}`,
                        body: img.imgUrl
                    })
                }).catch(err => {
                    ctx.emit('notification', {
                        title: `B2上传失败: ${img.fileName}`,
                        body: err.message
                    })
                })
            // PicGo会监视此属性，一旦赋值就会提前通知上传成功，但此时尚未上传成功
            img.imgUrl = `${configs.domain}/${configs.path ? configs.path : '/'}${img.fileName}${configs.imageProcess}`
        })
        return ctx
    } catch (err) {
        const message = (err as Error).message
        ctx.emit('notification', {
            title: '上传失败！',
            body: message
        })
    }
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

