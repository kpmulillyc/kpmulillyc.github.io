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
    MangaUpdates,
    TagType,
    TagSection,
} from "paperback-extensions-common"
import { MHRHelper } from "./MHRHelper"
import { Parser } from './MHRParser'

export const MHR_DOMAIN = 'https://hk.dm5.com'

export const MHRInfo: SourceInfo = {
    version: '1.4.5',
    name: '漫畫人',
    description: '漫畫人',
    author: 'kpwa',
    authorWebsite: 'https://github.com/kpmulillyc',
    icon: "favicon.ico",
    websiteBaseURL: MHR_DOMAIN,
    sourceTags: [
        {
            text: 'Notifications',
            type: TagType.GREEN
        }
    ],
    contentRating: ContentRating.EVERYONE,
}

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


    override async getSearchTags(): Promise<TagSection[]> {
        return this.parser.parseTags() || []
    }


    async getSearchResults(query: SearchRequest, metadata: any,): Promise<PagedResults> {
        if (metadata?.completed) return metadata
        const page: number = metadata?.page ?? 0
        let searchUrl = this.baseUrl + "/v1/search/getSearchManga?"
        let params: any = this.helper.paramBuilder()
        if (query.title) {
            params["start"] = page.toString()
            params["limit"] = "20"
            params["keywords"] = query.title


            searchUrl = this.helper.urlBuilder(searchUrl, params)
            let request = createRequestObject({
                url: searchUrl,
                method: 'GET'
            })

            let data = await this.requestManager.schedule(request, 1)
            metadata = !this.parser.isLastPage(data.data, false) ? { page: page + 20 } : undefined
            const tiles: MangaTile[] = this.parser.parseSearchResult(data.data)
            return createPagedResults({
                results: tiles,
                metadata: metadata
            })
        } else {
            const queryTag = query?.includedTags?.map((x: any) => x.id)[0]
            searchUrl = `${this.baseUrl}/v2/manga/getCategoryMangas?`
            params = this.helper.homePageParamBuilder()
            params["subCategoryType"] = queryTag.slice(0, 1)
            params["subCategoryId"] = queryTag.slice(1)
            params["start"] = page.toString()
            searchUrl = this.helper.urlBuilder(searchUrl, params)
            let request = createRequestObject({
                url: searchUrl,
                method: 'GET'
            })

            let data = await this.requestManager.schedule(request, 1)
            metadata = !this.parser.isLastPage(data.data, true) ? { page: page + 20 } : undefined
            const tiles: MangaTile[] = this.parser.parseHomeSection(data.data)

            return createPagedResults({
                results: tiles,
                metadata: metadata
            })
        }

    }

    override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {

        let homePageUrl = `${this.baseUrl}/v2/manga/getCategoryMangas?`

        const popularParams: any = this.helper.homePageParamBuilder()
        const lastUpdateParams: any = this.helper.homePageParamBuilder()
        const hotNewParams: any = this.helper.homePageParamBuilder()
        const hotEndParams: any = this.helper.homePageParamBuilder()
        lastUpdateParams["sort"] = "1"
        hotNewParams["sort"] = "2"
        hotEndParams["sort"] = "3"
        popularParams["limit"] = "20"
        lastUpdateParams["limit"] = "5"
        hotNewParams["limit"] = "5"
        hotEndParams["limit"] = "5"
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
                    id: 'popular',
                    title: '熱門',
                    view_more: true,
                    type: HomeSectionType.singleRowNormal
                }),
            },
            {
                request: createRequestObject({
                    url: lastUpdateUrl,
                    method: 'GET'
                }),
                section: createHomeSection({
                    id: 'updates',
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
                    id: 'hotNew',
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
                    id: 'hotEnd',
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

    override async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        if (metadata?.completed) return metadata

        const page: number = metadata?.page ?? 0
        let homePageUrl = `${this.baseUrl}/v2/manga/getCategoryMangas?`
        const params: any = this.helper.homePageParamBuilder()
        params["start"] = page.toString()
        switch (homepageSectionId) {
            case "popular":
                params["sort"] = 0
                break
            case "updates":
                params["sort"] = 1
                break
            case "hotNew":
                params["sort"] = 2
                break
            case "hotEnd":
                params["sort"] = 3
                break
            default:
                throw new Error('Requested to getViewMoreItems for a section ID which doesn\'t exist')
        }
        homePageUrl = this.helper.urlBuilder(homePageUrl, params)
        const request = createRequestObject({
            url: homePageUrl,
            method: 'GET'
        })

        const response = await this.requestManager.schedule(request, 1)
        const manga = this.parser.parseViewMore(response.data)
        metadata = !this.parser.isLastPage(response.data, true) ? { page: page + 20 } : undefined
        return createPagedResults({
            results: manga,
            metadata
        })
    }


    override async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {
        let updatedManga: string[] = []
        for (let index = 0; index < ids.length; index++) {
            let getMangaUrl = `${this.baseUrl}/v1/manga/getDetail?`
            const params: any = this.helper.paramBuilder()
            params["mangaId"] = ids[index]
            getMangaUrl = this.helper.urlBuilder(getMangaUrl, params)
            const request = createRequestObject({
                url: getMangaUrl,
                method: 'GET',
            })
            const response = await this.requestManager.schedule(request, 1)
            this.parser.parseUpdatedManga(response.data, time, ids[index]!, updatedManga)
        }
        if (updatedManga.length > 0) {
            mangaUpdatesFoundCallback(createMangaUpdates({
                ids: updatedManga
            }))
        }
    }
}