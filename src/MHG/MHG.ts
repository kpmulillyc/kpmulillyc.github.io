import {
    Chapter,
    ChapterDetails,
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
} from "paperback-extensions-common"

import { Parser, } from './MHGParser'

const MHG_DOMAIN = 'https://tw.manhuagui.com'
export const MHG_IMAGE_BASE_URL = 'https://i.hamreus.com'

export const MHGInfo: SourceInfo = {
    version: '1.0.0',
    name: 'ManHuaGui',
    description: 'ManHuaGui',
    author: 'kpwa',
    authorWebsite: 'https://kpmulillyc.github.io/',
    icon: "favicon.ico",
    websiteBaseURL: 'https://kpmulillyc.github.io/',
    contentRating: ContentRating.EVERYONE,
}
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0'
export class MHG extends Source {

    requestManager = createRequestManager({
        requestsPerSecond: 3,
        requestTimeout: 8000,
        interceptor: {
            interceptRequest: async (request: Request): Promise<Request> => {

                request.headers = {
                    ...(request.headers ?? {}),
                    ...{
                        'user-agent': userAgent,
                        'referer': `${MHG_DOMAIN}/`
                    }
                }

                return request
            },

            interceptResponse: async (response: MHGResponse): Promise<Response> => {
                response['fixedData'] = response.data ?? Buffer.from(createByteArray(response.rawData)).toString()
                return response
            }
        }
    }) as MHGRequestManager



    baseUrl: string = MHG_DOMAIN
    parser = new Parser()
    userAgentRandomizer: string = `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:77.0) Gecko/20100101 Firefox/78.0${Math.floor(Math.random() * 100000)}`


    override getMangaShareUrl(mangaId: string): string {
        return `${MHG_DOMAIN}/comic/${mangaId}/`
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {

        const request = createRequestObject({
            url: `${MHG_DOMAIN}/comic/${mangaId}/`,
            method: 'GET'
        })
        const data = await this.requestManager.schedule(request, 1)

        const $ = this.cheerio.load(data.data)


        return this.parser.parseMangaDetails($, mangaId)
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {

        const request = createRequestObject({
            url: `${MHG_DOMAIN}/comic/${mangaId}/`,
            method: "GET"
        })
        const data = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(data.data)
        const chapters = this.parser.parseChapterList($, mangaId)
        return chapters
    }


    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const requestUrl = `${MHG_DOMAIN}/comic/${mangaId}/${chapterId}.html`
        const request = createRequestObject({
            url: requestUrl,
            method: 'GET'
        })
        const data = await this.requestManager.schedule(request, 1)
        const pages: string[] = this.parser.parseChapterDetails(data.data)
        return createChapterDetails({
            pages,
            id: chapterId,
            mangaId,
            longStrip: false
        })
    }

    async getSearchResults(query: SearchRequest, metadata: any,): Promise<PagedResults> {
        let _a
        let page: number = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
        let searchUrl = ''
        if (query.title) {
            searchUrl = `${MHG_DOMAIN}/s/${encodeURI(query.title ?? '')}_p${page}.html`
        }
        const request = createRequestObject({
            url: searchUrl,
            method: 'GET'
        })
        const data = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(data.data)
        const mangaTiles = this.parser.parseSearchResult($)
        metadata = !this.parser.isLastPage($) ? { page: page + 1 } : undefined;
        return createPagedResults({
            results: mangaTiles,
            metadata
        })
    }

    override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const request = createRequestObject({
            url: `${this.baseUrl}`,
            method: 'GET',
        })
        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data ?? response['fixedData'])
        this.parser.parseHomeSections($, sectionCallback)
    }
}
export interface MHGResponse extends Response {
    fixedData: string;
}
export interface MHGRequestManager extends RequestManagerInfo {
    schedule: (request: Request, retryCount: number) => Promise<MHGResponse>;
}