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
} from 'paperback-extensions-common'
import { MHRHelper } from './MHRHelper'
import { Parser,
    UpdatedManga } from './MHRParser'

export const MHR_DOMAIN = 'https://hk.dm5.com'

export const MHRInfo: SourceInfo = {
    version: '2.0.1',
    name: '漫畫人',
    description: '漫畫人',
    author: 'kpwa',
    authorWebsite: 'https://github.com/kpmulillyc',
    icon: 'favicon.ico',
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
                    'user-agent': 'okhttp/3.12.13',
                    'referer': 'http://www.dm5.com/dm5api/',
                    'clubReferer': 'http://hk.mangaapi.manhuaren.com/',
                    'X-Yq-Key': '438166431',
                    'X-Yq-Yqpp': '{"flg":"","ac":"","cut":"GMT+8","laut":"0","fcc":"","flcc":"","ciso":"us","lcc":"","lot":"","lcn":"","flat":"","flot":"","lat":""}',
                    'X-Yq-Yqci': '{"at":-1,"av":"5.7.1.2","cl":"dm5","cy":"US","di":"-26,-64,-25,-72,38,-17,-6,109,88,60,-96,-74,77,12,66,-19,-38,70,106,121,-15,-13,16,-115,102,35,74,-75,103,97,70,51","dm":"Android SDK built for x86","fcl":"dm5","ft":"bsr","fut":"1659456508000","le":"en","ln":"","lut":"1659456508000","nt":1,"os":1,"ov":"30_11","pt":"com.ilike.cartoon","rn":"1440x2392","st":1}'
                }

                return request
            },

            interceptResponse: async (response: Response): Promise<Response> => {
                return response
            }
        }
    })
    baseUrl = 'http://hk.mangaapi.manhuaren.com'
    parser = new Parser()
    helper = new MHRHelper()

    override getMangaShareUrl(mangaId: string): string {
        return `https://hk.dm5.com/${mangaId}`
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {
        let getMangaUrl = `${this.baseUrl}/v1/manga/getDetail?`
        const params: any = this.helper.paramBuilder()
        params['mangaId'] = mangaId
        getMangaUrl = this.helper.urlBuilder(getMangaUrl, params)
        const request = createRequestObject({
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
        const request = createRequestObject({
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
        const request = createRequestObject({
            url: detailsUrl,
            method: 'GET',
        })
        const data = await this.requestManager.schedule(request, 1)
        return this.parser.parseChapterDetails(data.data, mangaId, chapterId)
    }


    override async getSearchTags(): Promise<TagSection[]> {
        return this.parser.parseTags() || []
    }


    async getSearchResults(query: SearchRequest, metadata: any,): Promise<PagedResults> {
        if (metadata?.completed) return metadata
        const page: number = metadata?.page ?? 0
        let searchUrl = this.baseUrl + '/v1/search/getSearchManga?'
        let params: any = this.helper.paramBuilder()
        if (query.title) {
            params['start'] = page.toString()
            params['limit'] = '20'
            params['keywords'] = query.title


            searchUrl = this.helper.urlBuilder(searchUrl, params)
            const request = createRequestObject({
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
            const request = createRequestObject({
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

    override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {

        const homePageUrl = `${this.baseUrl}/v2/manga/getSectionMangaList?`

        const popularParams: any = this.helper.homePageParamBuilder()
        const featureParams: any = this.helper.homePageParamBuilder()
        const hotParams: any = this.helper.homePageParamBuilder()
        const hotEndParams: any = this.helper.homePageParamBuilder()

        popularParams['sectionId'] = '701'
        featureParams['sectionId'] = '491'
        hotParams['sectionId'] = '501'
        hotEndParams['sectionId'] = '1051'

        const popularUrl = this.helper.urlBuilder(homePageUrl, popularParams)
        const lastUpdateUrl = this.helper.urlBuilder(homePageUrl, featureParams)
        const hotNewUrl = this.helper.urlBuilder(homePageUrl, hotParams)
        const hotEndUrl = this.helper.urlBuilder(homePageUrl, hotEndParams)

        const sections = [
            {
                request: createRequestObject({
                    url: popularUrl,
                    method: 'GET'
                }),
                section: createHomeSection({
                    id: 'popular',
                    title: '日韓',
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
                    title: '精品',
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
                    title: '熱門',
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
                    title: '完結',
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