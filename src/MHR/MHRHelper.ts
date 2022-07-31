import { Md5 } from 'ts-md5/dist/md5'

const C = "4e0a48e1c0b54041bce9c8f0e036124d"

export class MHRHelper {

    urlBuilder(url: string, params: any): string {
        const hashStr = this.generateGSNHash(params)
        params["gsn"] = hashStr
        for (const key in params) {
            url += key + "="
            if (key === "gts")
                url += this.timeEncode(params[key])
            else
                url += encodeURI(params[key])
            url += "&"
        }
        return url.slice(0, -1)
    }

    paramBuilder(): {} {
        const timeElapsed = Date.now();
        const today = new Date(timeElapsed);
        const now = today.toISOString().replace("T", "+").slice(0, -5)
        const params: any = {
            "gsm": "md5",
            "gft": "json",
            "gts": now,
            "gak": "android_manhuaren2",
            "gat": "",
            "gau": "191909801",
            "gui": "191909801",
            "gut": "0",
        }
        return params
    }

    homePageParamBuilder(): {} {
        const params:any = this.paramBuilder()
        params["subCategoryType"] = "0"
        params["subCategoryId"] = "0"
        params["start"] = "0"
        params["limit"] = "20"
        params["sort"] = "0"
        return params
    }

    generateGSNHash(params: {}): string {
        let s = C + "GET"
        const sortedObj: any = Object.fromEntries(Object.entries(params).sort())
        for (let key in sortedObj) {
            if (key != "gsn") {
                s += key
                if (key == "gts")
                    s += this.timeEncode(sortedObj[key]!.toString())
                else
                    s += encodeURI(sortedObj[key]!.toString())
            }
        };
        s += C
        return Md5.hashStr(s)
    }

    timeEncode(timeStr: string): string {
        return timeStr.replace("+", "%2B").replace(":", "%3A").replace(":", "%3A")
    }
}