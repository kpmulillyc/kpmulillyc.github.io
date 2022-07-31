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
    SourceInfo,
    ContentRating,
    HomeSectionType,
    MangaTile,
} from "paperback-extensions-common"
import { MHRHelper } from "./MHRHelper"
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
        requestsPerSecond: 4,
        requestTimeout: 15000,
        interceptor: {
            interceptRequest: async (request: Request): Promise<Request> => {

                request.headers = {
                    'user-agent': "okhttp/3.11.0",
                    'referer': "http://www.dm5.com/dm5api/",
                    'clubReferer': "http://mangaapi.manhuaren.com/",
                    'X-Yq-Yqci': "{\"le\": \"zh\"}"
                }

                return request
            },

            interceptResponse: async (response: Response): Promise<Response> => {
                return response
            }
        }
    })


    baseUrl: string = "http://mangaapi.manhuaren.com"
    parser = new Parser()
    helper = new MHRHelper()

    override getMangaShareUrl(mangaId: string): string {
        return `https://hk.dm5.com/${mangaId}`
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {
        let getMangaUrl = `${this.baseUrl}/v1/manga/getDetail?`
        const params: any = this.helper.paramBuilder()
        params["mangaId"] = mangaId
        getMangaUrl = this.helper.urlBuilder(getMangaUrl, params)
        let request = createRequestObject({
            url: getMangaUrl,
            method: 'GET'
        })
        const data = await this.requestManager.schedule(request, 1)
        return this.parser.parseMangaDetails(data.data, mangaId)
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {

        let getChapterUrl = `${this.baseUrl}/v1/manga/getDetail?`
        const params: any = this.helper.paramBuilder()
        params["mangaId"] = mangaId
        getChapterUrl = this.helper.urlBuilder(getChapterUrl, params)
        let request = createRequestObject({
            url: getChapterUrl,
            method: 'GET'
        })
        const data = await this.requestManager.schedule(request, 1)
        let chapters = this.parser.parseChapterList(data.data, mangaId)

        return chapters
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        let detailsUrl = `${this.baseUrl}/v1/manga/getRead?`
        const params: any = this.helper.paramBuilder()
        params["mangaSectionId"] = chapterId
        params["netType"] = "4"
        params["loadreal"] = "1"
        params["imageQuality"] = "2"
        detailsUrl = this.helper.urlBuilder(detailsUrl, params)
        let request = createRequestObject({
            url: detailsUrl,
            method: 'GET',
        })
        let data = await this.requestManager.schedule(request, 1)
        return this.parser.parseChapterDetails(data.data, mangaId, chapterId)
    }

    async getSearchResults(query: SearchRequest, metadata: any,): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1
        let searchUrl = this.baseUrl + "/v1/search/getSearchManga?"
        let params: any = this.helper.paramBuilder()
        if (query.title) {
            params["start"] = "0"
            params["limit"] = "20"
            params["keywords"] = query.title
        }

        searchUrl = this.helper.urlBuilder(searchUrl, params)
        let request = createRequestObject({
            url: searchUrl,
            method: 'GET'
        })

        let data = await this.requestManager.schedule(request, 1)
        const tiles: MangaTile[] = this.parser.parseSearchResult(data.data)
        return createPagedResults({
            results: tiles,
            metadata: page
        })

    }

    override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {

        let homePageUrl = `${this.baseUrl}/v2/manga/getCategoryMangas?`

        const popularParams = this.helper.homePageParamBuilder()
        const lastUpdateParams:any = this.helper.homePageParamBuilder()
        const hotNewParams:any = this.helper.homePageParamBuilder()
        const hotEndParams:any = this.helper.homePageParamBuilder()
        lastUpdateParams["sort"] = "1"
        hotNewParams["sort"] = "2"
        hotEndParams["sort"] = "3"
        const popularUrl = this.helper.urlBuilder(homePageUrl, popularParams)
        const lastUpdateUrl = this.helper.urlBuilder(homePageUrl, lastUpdateParams)
        const hotNewUrl = this.helper.urlBuilder(homePageUrl, hotNewParams)
        const hotEndUrl = this.helper.urlBuilder(homePageUrl, hotEndParams)

        const sections = [
            {
                request: createRequestObject({
                    url: popularUrl,
                    method: 'GET'
                }),
                section: createHomeSection({
                    id: '0',
                    title: '熱門',
                    view_more: false,
                    type: HomeSectionType.singleRowLarge
                }),
            },
            {
                request: createRequestObject({
                    url: lastUpdateUrl,
                    method: 'GET'
                }),
                section: createHomeSection({
                    id: '1',
                    title: '最近更新',
                    view_more: true,
                    type: HomeSectionType.singleRowNormal
                }),
            },
            {
                request: createRequestObject({
                    url: hotNewUrl,
                    method: 'GET'
                }),
                section: createHomeSection({
                    id: '2',
                    title: '熱門新作',
                    view_more: true,
                    type: HomeSectionType.singleRowNormal
                }),
            },
            {
                request: createRequestObject({
                    url: hotEndUrl,
                    method: 'GET'
                }),
                section: createHomeSection({
                    id: '3',
                    title: '熱門完結',
                    view_more: true,
                    type: HomeSectionType.singleRowNormal
                }),
            }
        ]
        const promises: Promise<void>[] = []
        for (const section of sections) {
            sectionCallback(section.section)

            promises.push(
                this.requestManager.schedule(section.request, 1).then((response: { data: string | Buffer }) => {
                    section.section.items = this.parser.parseHomeSection(response.data)
                    sectionCallback(section.section)
                }),
            )
        }

        await Promise.all(promises)
    }
}