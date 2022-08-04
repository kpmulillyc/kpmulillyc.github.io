import { Md5 } from 'ts-md5/dist/md5'

const C = "4e0a48e1c0b54041bce9c8f0e036124d"

export class MHRHelper {

    urlBuilder(url: string, params: any): string {
        const hashStr = this.generateGSNHash(params)
        params["gsn"] = hashStr
        for (const key in params) {
            url += key + "="
            url += this.requestEncode(params[key])
            url += "&"
        }
        return url.slice(0, -1)
    }

    paramBuilder(): {} {
        const timeElapsed = Date.now();
        const today = new Date(timeElapsed);
        const now = today.toISOString().replace("T", "+").slice(0, -5)
        const params: any = {
            "gac": "",
            "gak": "android_manhuaren2",
            "gat": "",
            "gaui": "438166431",
            "gav": "5.7.1.2",
            "gciso": "us",
            "gcl": "dm5",
            "gcut": "GMT+8",
            "gcy": "US",
            "gdi": "-26,-64,-25,-72,38,-17,-6,109,88,60,-96,-74,77,12,66,-19,-38,70,106,121,-15,-13,16,-115,102,35,74,-75,103,97,70,51",
            "gfcc": "",
            "gfcl": "dm5",
            "gflat": "",
            "gflcc": "",
            "gflg": "",
            "gflot": "",
            "gft": "json",
            "gfut": "1659456508000",
            "glat": "",
            "glbsaut": "0",
            "glcc": "",
            "glcn": "",
            "gle": "en",
            "gln": "",
            "glot": "",
            "glut": "1659456508000",
            "gos": "1",
            "gov": "30_11",
            "gpt": "com.ilike.cartoon",
            "gsm": "md5",
            "gts": now,
            "gui": "438166431",
            "gut": "0"
        }
        return params
    }

    homePageParamBuilder(): {} {
        const params: any = this.paramBuilder()
        params["start"] = "0"
        params["limit"] = "5"
        return params
    }

    generateGSNHash(params: {}): string {
        let s = C + "GET"
        const sortedObj: any = Object.fromEntries(Object.entries(params).sort())
        for (let key in sortedObj) {
            if (key != "gsn") {
                s += key
                s += this.requestEncode(sortedObj[key])
            }
        };
        s += C
        return Md5.hashStr(s)
    }

    requestEncode(timeStr: string): string {
        return encodeURIComponent(timeStr.replace("%7E", "~").replace("*", "%2A"))
    }
}