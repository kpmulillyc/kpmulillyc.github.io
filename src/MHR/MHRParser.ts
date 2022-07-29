import {
    Chapter, ChapterDetails, LanguageCode, Manga, MangaStatus, MangaTile, PagedResults,
    Request,
    Response
} from 'paperback-extensions-common'
import { MHR_DOMAIN, userAgent } from './MHR'


export class Parser {

    requestManager = createRequestManager({
        requestsPerSecond: 1,
        requestTimeout: 8000,
        interceptor: {
            interceptRequest: async (request: Request): Promise<Request> => {

                request.headers = {
                    'user-agent': userAgent,
                    'referer': MHR_DOMAIN

                }

                return request
            },

            interceptResponse: async (response: Response): Promise<Response> => {
                return response
            }
        }
    })

    parseMangaDetails($: CheerioSelector, mangaId: string): Manga {
        let mainTitle = $('div.info > p.title').contents().first().text().trim()
        let desc = $('div.info > p.content').text().trim().replace('[-折叠]', '').trim()
        let coverUrl = $('div.banner_detail_form > div > img').attr('src')!
        let author = $('div.info > p.subtitle > a').text().trim()
        let status = this.mangaStatus($('div.info > p.tip > span > span').text().trim())
        return createManga({
            id: mangaId,
            image: coverUrl,
            desc: desc,
            status: status,
            author: author,
            titles: [mainTitle],
        })
    }

    mangaStatus(str: string) {
        if (str == '连载中') return MangaStatus.ONGOING
        if (str == '已完结') return MangaStatus.COMPLETED
        return MangaStatus.UNKNOWN
    }

    parseChapterList($: CheerioSelector, mangaId: string): Chapter[] {
        let chapters: Chapter[] = []
        let chapArray = $('ul.view-win-list')
        let counter = 1
        chapArray.find('a').toArray().forEach(obj => {
            let chapterId = $(obj).attr('href')
            let chapName = $(obj).contents().first().text().trim()
            // let chapNum = parseFloat((chapName!.match(/[\d.]+/) ?? ['0'])[0] ?? '0')
            if (typeof chapterId === 'undefined') return
            chapters.push(createChapter({
                id: chapterId,
                mangaId: mangaId,
                chapNum: counter++,
                langCode: LanguageCode.CHINEESE_HONGKONG,
                name: chapName,
            }))
        })
        return chapters
    }

    parseSearchResult($: CheerioSelector): PagedResults {
        const result: MangaTile[] = []
        const mhList = $('ul.mh-list.col7 > li > div ').toArray()

        mhList.forEach(obj => {
            const id = $(obj).find('h2 > a').attr('href')!
            const image = $(obj).find('p.mh-cover').attr('style')!.match(/(https:\/\/.+)\)/)![1]
            const title = $(obj).find('h2 > a').attr('title')!
            result.push(createMangaTile({
                id,
                image: image!,
                title: createIconText({ text: title }),
            }))
        });
        return createPagedResults({
            results: result,
            metadata: 'mData',
        })
    }

    parseChapterDetails($: CheerioSelector, mangaId: string, chapterId: string): ChapterDetails {

        console.log($);

        // const cid = 
        //https://hk.dm5.com/m1296047/chapterfun.ashx?cid=1296047&page=2&key=&language=1&gtk=6&_cid=1296047&_mid=10684&_dt=2022-07-28+16%3A20%3A34&_sign=1e98ac881e77b5c0a8c329cab546907f
        const pages: string[] = []
        return createChapterDetails({
            id: chapterId,
            mangaId,
            pages: pages,
            longStrip: false,
        })
    }


    parseHomeSection($: CheerioSelector): MangaTile[] {
        let tiles: MangaTile[] = []

        let mangaList = $('ul#contList').text() !== '' ? $('ul#contList') : $('ul[class="rank-list clearfix"]')
        for (let obj of $('li', mangaList).toArray()) {
            let coverUrl = $('img', $('a.cover', $(obj))).attr('src')
            let mangaTitle = $('a', $('p.ell', $(obj))).text()
            let mangaUrl = $('a', $('p.ell', $(obj))).attr('href')
            // let chpaterInfo = $('span.tt', $('a.cover', $(obj))).text()
            let mangaIdMatchObj = /(https?|http):\/\/www.90mh.com\/manhua\/([^\/]*)/.exec(mangaUrl ?? '')!
            if (mangaIdMatchObj.length !== 3) continue
            let mangaId = mangaIdMatchObj[2]
            // let chpaterNumberMatchObj = /\D*(\d*(\.\d*)?).*/.exec(chpaterInfo)!
            // let chpaterNumber = chpaterNumberMatchObj.length === 3 ? +chpaterNumberMatchObj[1] : 0
            tiles.push(createMangaTile({
                id: mangaId!,
                title: createIconText({ text: mangaTitle }),
                image: coverUrl ?? ''
            }))
        }

        return tiles
    }

    async parsePages($: CheerioSelector, chapterId: string): Promise<string[]> {
        const pages: string[] = []
        const html = $('script').contents().first().text().trim()
        const cid = html.match(/var DM5_CID=(\d+);/s)![1]
        let page = 1
        const mid = html.match(/var DM5_MID=(\d+);/s)![1]
        let dt = html.match(/var DM5_VIEWSIGN_DT=\"(.+)\";/)![1]
        dt = dt!.replace(' ', '+').replace(':', '%3A')
        const sign = html.match(/var DM5_VIEWSIGN=\"(.+)\";\s+var/)![1]
        const imgCount = html.match(/var DM5_IMAGE_COUNT=(\d+);/)![1]
        while (pages.length !== parseInt(imgCount!)) {
            let requestUrl = `${MHR_DOMAIN}${chapterId}chapterfun.ashx?cid=${cid}&page=${page++}&key=&language=1&gtk=6&_cid=${cid}&_mid=${mid}&_dt=${dt}&_sign=${sign}`
            let request = createRequestObject({
                url: requestUrl,
                headers: { 'user-agent': userAgent, 'referer': `${MHR_DOMAIN}${chapterId}` },
                method: 'GET'
            })
            let data = await this.requestManager.schedule(request, 1)
            const result = eval(eval(data.data))[0]
            pages.push(result)
            console.log(result);
        }
        return pages
    }

    isLastPage($: CheerioSelector): boolean {
        return $('li.next').text() === ''
    }

}
