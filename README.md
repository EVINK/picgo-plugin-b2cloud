为[Picgo](https://github.com/Molunerfinn/PicGo)提供[B2Cloud](https://backblaze.com)云存储支持。

## 安装

⚠️ 注意：目前仅支持本地安装

1. 下载仓库至本地

```sh
$ git clone git@github.com:EVINK/picgo-plugin-b2cloud.git
```

2. 安装依赖

```sh
$ npm intall && npm run build
$ #OR
$ yarn && yarn build
```

3. 在 __PicGo__ 中选择 __导入本地插件__,点选本地文件夹 __picgo-plugin-b2cloud__

![](https://arfsvboaor.cloudimg.io/picgo/local-installation.webp)

## 配置文件说明

### 1. KeyId 和 ApplicationKey

前往 <https://secure.backblaze.com/app_keys.htm>，点击添加一个新的Application Key


![](https://arfsvboaor.cloudimg.io/picgo/b2cloud-appkey.webp)

### 2. 访问前缀

一般的前缀有下面两种

* https://f004.backblazeb2.com/file/<your_bucket_name>
* https://<your_bucket_name>.s3.us-west-004.backblazeb2.com

但若是配置了图片cdn，则可按需配置为你的cdn前缀，例如：

* https://cdn.evink.cn/
* https://img.evink.cn/

此项并非必要，若不提供此项，则仅返回图片尾部地址。（如：img/a.jpg）

### 3. 图片预处理

如果支持图片预处理，则可以在这个选项中添加对应的后缀，例如：

* https://img.evink.cn/light/fullsizeoutput_b5.jpeg (原图)
* https://img.evink.cn/light/fullsizeoutput_b5.jpeg?p=c_face (后缀为 __?p=c_face__)
