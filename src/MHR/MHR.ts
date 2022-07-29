import {
    Chapter,
    ChapterDetails,
    // MangaTile,
    HomeSection,
    Manga,
    PagedResults,
    SearchRequest,
    Source,
    Request,
    Response,
    RequestManagerInfo,
    SourceInfo,
    ContentRating,
    HomeSectionType,
} from "paperback-extensions-common"

import { Parser, } from './MHRParser'

export const MHR_DOMAIN = 'https://hk.dm5.com'

export const MHRInfo: SourceInfo = {
    version: '0.1.0',
    name: '漫畫人',
    description: '漫畫人',
    author: 'kpwa',
    authorWebsite: 'https://github.com/kpwa',
    icon: "favicon.ico",
    websiteBaseURL: MHR_DOMAIN,
    contentRating: ContentRating.EVERYONE,
}
export const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:103.0) Gecko/20100101 Firefox/103.0'

export class MHR extends Source {

    requestManager = createRequestManager({
        requestsPerSecond: 3,
        requestTimeout: 8000,
        interceptor: {
            interceptRequest: async (request: Request): Promise<Request> => {

                request.headers = {
                    'user-agent': userAgent,
                    // 'referer': MHR_DOMAIN,

                }

                return request
            },

            interceptResponse: async (response: MHRResponse): Promise<Response> => {
                response['fixedData'] = response.data ?? Buffer.from(createByteArray(response.rawData)).toString()
                return response
            }
        }
    }) as MHRRequestManager


    baseUrl: string = MHR_DOMAIN
    parser = new Parser()


    override getMangaShareUrl(mangaId: string): string {
        return `${MHR_DOMAIN}${mangaId}`
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {

        let request = createRequestObject({
            url: `${MHR_DOMAIN}${mangaId}`,
            method: 'GET'
        })
        const data = await this.requestManager.schedule(request, 1)

        let $ = this.cheerio.load(data.data)


        return this.parser.parseMangaDetails($, mangaId)
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {

        let request = createRequestObject({
            url: `${MHR_DOMAIN}${mangaId}`,
            method: "GET"
        })

        const data = await this.requestManager.schedule(request, 1)
        let $ = this.cheerio.load(data.data)

        let chapters = this.parser.parseChapterList($, mangaId)

        return chapters
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        let requestUrl = `${MHR_DOMAIN}${chapterId}`
        // let requestUrl = `https://hk.dm5.com/m1297421/chapterfun.ashx?cid=1297421&page=1&key=&language=1&gtk=6&_cid=1297421&_mid=10684&_dt=2022-07-29+20%3A47:08&_sign=06b9494ffa3d05cabd4b003d43add1bf`
        let request = createRequestObject({
            url: requestUrl,
            headers: { "user-agent": userAgent },
            method: 'GET',
        })
        let data = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(data.data)
        const pages: any = this.parser.parsePages($, chapterId)

        // const parameters = {
        //     headers: {
        //         'user-agent': userAgent,
        //         'referer': MHR_DOMAIN + chapterId
        //     },
        //     method: 'GET'
        // try {
        //     const request = {
        //       url: 'https://www.google.com/',
        //       method: 'GET',
        //     }

        // const response = await axios(request)

        // console.log(response)
        // } catch(e) {

        // console.log(e)

        // }

        return createChapterDetails({
            id: chapterId,
            mangaId,
            pages: pages,
            longStrip: false,
        })
    }

    async getSearchResults(query: SearchRequest, metadata: any,): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1
        let searchUrl = ''
        if (query.title) {
            searchUrl = `${MHR_DOMAIN}/search?title=${encodeURI(query.title)}&language=1&page=${page}`
        }
        let request = createRequestObject({
            url: searchUrl,
            method: 'GET'
        })

        let data = await this.requestManager.schedule(request, 1)
        let $ = this.cheerio.load(data.data)
        // const tiles: MangaTile[] = [];

        return this.parser.parseSearchResult($)

    }

    override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {

        const sections = [
            {
                request: createRequestObject({
                    url: `${MHR_DOMAIN}/rank/click-daily/`,
                    method: 'GET'
                }),
                section: createHomeSection({
                    id: '0',
                    title: '日排行',
                    view_more: false,
                    type: HomeSectionType.featured,
                }),
            },
            {
                request: createRequestObject({
                    url: `${MHR_DOMAIN}/update/`,
                    method: 'GET'
                }),
                section: createHomeSection({
                    id: '1',
                    title: '最近更新',
                    view_more: true,
                }),
            },
            {
                request: createRequestObject({
                    url: `${MHR_DOMAIN}/list/lianzai/click/`,
                    method: 'GET'
                }),
                section: createHomeSection({
                    id: '2',
                    title: '热门连载',
                    view_more: true,
                }),
            }
        ]



        const promises: Promise<void>[] = []

        for (const section of sections) {
            sectionCallback(section.section)

            promises.push(
                this.requestManager.schedule(section.request, 1).then(response => {
                    const $ = this.cheerio.load(response.data)
                    console.log($);

                    // section.section.items = this.parser.parseHomeSection($, this.cheerio)
                    sectionCallback(section.section)
                }),
            )
        }

        await Promise.all(promises)
    }

    // constructHeaders(headers: any, refererPath?: string): any {
    //     // if (this.userAgentRandomizer !== '') {
    //     //     headers["user-agent"] = this.userAgentRandomizer
    //     // }
    //     headers["referer"] = `https://tw.manhuagui.com/`
    //     headers["User-Agent"]='Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0'
    //     // headers["content-type"] = "application/x-www-form-urlencoded"
    //     return headers
    // }

    // globalRequestHeaders(): RequestHeaders {
    //     if (this.userAgentRandomizer !== '') {
    //         return {
    //             "referer": `${this.baseUrl}/`,
    //             "user-agent": this.userAgentRandomizer,
    //             "accept": "image/jpeg,image/png,image/*;q=0.8"
    //         }
    //     }
    //     else {
    //         return {
    //             "referer": `${this.baseUrl}/`,
    //             "accept": "image/jpeg,image/png,image/*;q=0.8"
    //         }
    //     }
    // }

}
export interface MHRResponse extends Response {
    fixedData: string;
}
export interface MHRRequestManager extends RequestManagerInfo {
    schedule: (request: Request, retryCount: number) => Promise<MHRResponse>;
}
