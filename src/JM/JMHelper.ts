import CryptoJS = require('crypto-js')


const MAGIC = '1659951655'
const API_VERSION = '1.4.4'

export function decode(encrypted: string): string {
    let data
    
    try {
        const key = encodeKey(MAGIC + decodeSalt)
        const vector = CryptoJS.enc.Utf8.parse(key)
        const decoded_data = CryptoJS.AES.decrypt(encrypted, vector, {
            mode: CryptoJS.mode.ECB,
        })
        data = decoded_data.toString(CryptoJS.enc.Utf8)
    } catch (e) {
        console.error(e)
        throw e
    }
    return data
}

const encodeSalt = '18comicAPP'
const decodeSalt = '18comicAPPContent'

export function randomMagic() : number{
    const o = new Date()
    const f = new Date(o.toUTCString())
    return Math.floor(f.getTime() / 1e3)
}

export function encodeKey(key: string):string {
    return CryptoJS.MD5(key).toString()
}

export function getToken():Record<string,string> {
    const TokenParam = MAGIC + ',' + API_VERSION
    const token = encodeKey(MAGIC + encodeSalt)
    return {Tokenparam: TokenParam, Token: token}
}

