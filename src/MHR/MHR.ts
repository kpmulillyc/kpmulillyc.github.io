import {
    SourceManga,
    Chapter,
    ChapterDetails,
    HomeSection,
    SearchRequest,
    PagedResults,
    HomeSectionType,
    SourceInfo,
    TagSection,
    ContentRating,
    Request,
    Response,
    SourceIntents,
    ChapterProviding,
    MangaProviding,
    SearchResultsProviding,
    HomePageSectionsProviding
} from '@paperback/types'

import { MHRHelper } from './MHRHelper'
import {
    Parser,
    UpdatedManga
} from './MHRParser'

export const MHR_DOMAIN = 'https://hk.dm5.com'
//updateworkflow

export const MHRInfo: SourceInfo = {
    version: '3.0.1',
    name: '漫畫人',
    description: '漫畫人',
    author: 'kpwa',
    authorWebsite: 'https://github.com/kpmulillyc',
    icon: 'icon.png',
    websiteBaseURL: MHR_DOMAIN,
    sourceTags: [
    ],
    contentRating: ContentRating.EVERYONE,
    intents: SourceIntents.MANGA_CHAPTERS | SourceIntents.HOMEPAGE_SECTIONS
}

export class MHR implements SearchResultsProviding, MangaProviding, ChapterProviding, HomePageSectionsProviding {
    constructor(private cheerio: CheerioAPI) { }
    requestManager = App.createRequestManager({
        requestsPerSecond: 4,
        requestTimeout: 15000,
        interceptor: {
            interceptRequest: async (request: Request): Promise<Request> => {
                request.headers = {
                    ...(request.headers ?? {}),
                    ...{
                        'user-agent': 'Mozilla/5.0 (Linux; Android 13; Android SDK built for x86_64 Build/TE1A.220922.034; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/101.0.4951.61 Mobile Safari/537.36',
                        'referer': 'http://www.dm5.com/dm5api/',
                        // 'clubReferer': 'http://hk.mangaapi.manhuaren.com/',
                        'Authorization': 'YINGQISTS2 eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc19mcm9tX3JndCI6ZmFsc2UsInVzZXJfbGVnYWN5X2lkIjo0OTY1NzQ4MTEsImRldmljZV9pZCI6IjcxNTkxZjUxODhmMGJlMGYiLCJ1dWlkIjoiZWQ4YTdmOWMtZjgxZS00MmM3LWFjZmMtNWQ4NmM5MzMxNGI5IiwiY3JlYXRldGltZV91dGMiOiIyMDI0LTA3LTI5IDEyOjM4OjQxIiwibmJmIjoxNzIyMjU2NzIxLCJleHAiOjE3MjIyNjAzMjEsImlhdCI6MTcyMjI1NjcyMX0.J_8hUOoLvukxg1b16Y0iQeSO1qsPMu-3wtyfn7Ngwlry88RpxI4a8qnIuM4Z49LNfysjN3RAtil01U_VmofXIea0KHBWtXeP81w8VZcCzjul5WbUCDW4wl_EhVUkepcZ3M6Hwd9RkFyVo89oqa_Kfh6vRZSu9crjr2gH3ERugnn_iJEWU9CF3NC_KDGccGPC4XuWIcaqboagWMFyzR6YFBNSdkKZLjtbGatuyJ_pi4NnLwJ0rrswVaaNCvvpu58TQR1CDz8QKLj-IqyXjuTHbp3i9rJ_YnLVX3fw-Pcnc01Fa8ROfLYLHkUDBjdv_Ff2SvRnjPMMwOCbIHPCtxelSA',
                        'yq_is_anonymous': '1',
                        'X-Yq-Key': '496574811',
                        'X-Yq-Yqpp': '{"flg":"","ac":"","cut":"GMT+8","laut":"0","fcc":"","flcc":"","ciso":"us","lcc":"","lot":"","lcn":"","flat":"","flot":"","lat":""}',
                        'X-Yq-Yqci': '{"at":-1,"av":"7.1.9","cl":"dm5","cy":"US","di":"71591f5188f0be0f","dm":"Android SDK built for x86_64","fcl":"dm5","ft":"mhr","fut":"1722285521000","installation":"dm5","le":"en-US","ln":"","lut":"1722285521000","nt":1,"os":1,"ov":"33_13","pt":"com.mhr.mangamini","rn":"1440x2392","st":0}'
                    }
                }
                return request
            },
            interceptResponse: async (response: Response): Promise<Response> => {
                return response
            }
        }
    });
    baseUrl = 'https://mangaapi.manhuaren.com'
    parser = new Parser()
    helper = new MHRHelper()

    getMangaShareUrl(mangaId: string): string { return `${MHR_DOMAIN}/${mangaId}` }

    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        let getMangaUrl = `${this.baseUrl}/v1/manga/getDetail?`
        const params: any = this.helper.paramBuilder()
        params['mangaId'] = mangaId
        getMangaUrl = this.helper.urlBuilder(getMangaUrl, params)
        const request = App.createRequestObject({
            url: getMangaUrl,
            method: 'GET'
        })
        const data = await this.requestManager.schedule(request, 1)
        return this.parser.parseMangaDetails(data.data, mangaId)
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        let getChapterUrl = `${this.baseUrl}/v1/manga/getSections?`
        const params: any = this.helper.paramBuilder()
        params['mangaId'] = mangaId
        getChapterUrl = this.helper.urlBuilder(getChapterUrl, params)
        const request = App.createRequestObject({
            url: getChapterUrl,
            method: 'GET'
        })
        const data = await this.requestManager.schedule(request, 1)
        const chapters = this.parser.parseChapterList(data.data, mangaId)

        return chapters
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        let detailsUrl = `${this.baseUrl}/v1/manga/getRead?`
        const params: any = this.helper.paramBuilder()
        params['mangaSectionId'] = chapterId
        params['netType'] = '1'
        params['loadreal'] = '1'
        params['imageQuality'] = '2'
        detailsUrl = this.helper.urlBuilder(detailsUrl, params)
        const request = App.createRequestObject({
            url: detailsUrl,
            method: 'GET'
        })
        const data = await this.requestManager.schedule(request, 1)
        return this.parser.parseChapterDetails(data.data, mangaId, chapterId)
    }


    override async getSearchTags(): Promise<TagSection[]> {
        return this.parser.parseTags() || []
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {


        const homePageUrl = `${this.baseUrl}/v1/manga/getRank?`

        const popularParams: any = this.helper.homePageParamBuilder()
        const featureParams: any = this.helper.homePageParamBuilder()
        const hotParams: any = this.helper.homePageParamBuilder()
        const hotEndParams: any = this.helper.homePageParamBuilder()

        popularParams['sortType'] = '0'
        featureParams['sortType'] = '1'
        hotParams['sortType'] = '2'
        hotEndParams['sortType'] = '3'

        const popularUrl = this.helper.urlBuilder(homePageUrl, popularParams)
        const lastUpdateUrl = this.helper.urlBuilder(homePageUrl, featureParams)
        const hotNewUrl = this.helper.urlBuilder(homePageUrl, hotParams)
        const hotEndUrl = this.helper.urlBuilder(homePageUrl, hotEndParams)


        const sections = [
            
            {
                request: App.createRequestObject({
                    url: popularUrl,
                    method: 'GET'
                }),
                section: createHomeSection({
                    id: 'popular',
                    title: '人氣榜',
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
                    id: 'hotEnd',
                    title: '新番榜',
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
                    title: '打賞榜',
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
                    title: '收藏榜',
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


    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        if (metadata?.completed) return metadata
        const page: number = metadata?.page ?? 0
        let searchUrl = this.baseUrl + '/v1/search/getSearchManga?'
        let params: any = this.helper.paramBuilder()
        if (query.title) {
            params['start'] = page.toString()
            params['limit'] = '20'
            params['keywords'] = query.title


            searchUrl = this.helper.urlBuilder(searchUrl, params)
            const request = App.createRequestObject({
                url: searchUrl,
                method: 'GET'
            })

            const data = await this.requestManager.schedule(request, 1)
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
            params['subCategoryType'] = queryTag.slice(0, 1)
            params['subCategoryId'] = queryTag.slice(1)
            params['start'] = page.toString()
            params['limit'] = '20'
            searchUrl = this.helper.urlBuilder(searchUrl, params)
            const request = App.createRequestObject({
                url: searchUrl,
                method: 'GET'
            })

            const data = await this.requestManager.schedule(request, 1)
            metadata = !this.parser.isLastPage(data.data, true) ? { page: page + 20 } : undefined
            const tiles: MangaTile[] = this.parser.parseHomeSection(data.data)

            return createPagedResults({
                results: tiles,
                metadata: metadata
            })
        }
    }


    override async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        if (metadata?.completed) return metadata

        const page: number = metadata?.page ?? 0
        let homePageUrl = `${this.baseUrl}/v2/manga/getSectionMangaList?`
        const params: any = this.helper.homePageParamBuilder()
        params['start'] = page.toString()
        params['limit'] = '20'
        switch (homepageSectionId) {
            case 'popular':
                params['sectionId'] = '701'
                break
            case 'updates':
                params['sectionId'] = '491'
                break
            case 'hotNew':
                params['sectionId'] = '501'
                break
            case 'hotEnd':
                params['sectionId'] = '1051'
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
        let page = 0


        let updatedManga: UpdatedManga = {
            ids: [],
            loadMore: true
        }

        while (updatedManga.loadMore) {
            let updateUrl = `${this.baseUrl}/v1/manga/getUpdate?`
            const params: any = this.helper.homePageParamBuilder()
            params['limit'] = '100'
            params['start'] = page.toString()
            updateUrl = this.helper.urlBuilder(updateUrl, params)
            const request = createRequestObject({
                url: updateUrl,
                method: 'GET',
            })

            const response = await this.requestManager.schedule(request, 1)

            updatedManga = this.parser.parseUpdatedManga(response.data, time, ids)
            if (updatedManga.ids.length > 0) {
                mangaUpdatesFoundCallback(createMangaUpdates({
                    ids: updatedManga.ids
                }))
            }
            page += 100
        }

    }
}
