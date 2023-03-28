export class Cache {
    public static obj = {} as {
        [key: string]: {
            expiresAt?: number,
            data: string
        }
    }

    public static set (key: string, value: string) {
        this.obj[key] = { data: value }
    }

    public static get (key: string) {
        const v = this.obj[key]
        if (!v) return
        if (v.expiresAt && v.expiresAt <= Date.now()) {
            delete this.obj[key]
            return
        }
        return v.data
    }

    public static expires (key:string, seconds: number) {
        const v = this.obj[key]
        if (!v) return
        v.expiresAt = Date.now() + seconds * 1000
    }
}