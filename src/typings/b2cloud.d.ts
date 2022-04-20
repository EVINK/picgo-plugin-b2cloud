declare module 'b2-cloud-storage' {
    export = B2CloudStorage
}

interface B2ConstructorData {
    auth: {
        accountId: string,
        applicationKey: string
    }
}

declare class B2CloudStorage {
    constructor(data: B2ConstructorData)
    public authorize(callback: (err: Error) => void): void
    public uploadFile(
        path: string,
        options: { [key: string]: string | ((update: any) => void) },
        cb: (err: Error, results: any) => void
    ): void
}

interface B2CloudConfig {
    accountId: string
    applicationKey: string
    bucketId: string
    domain?: string
    path? : string
    imageProcess?: string
}