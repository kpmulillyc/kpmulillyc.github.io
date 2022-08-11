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
    TagType,
    TagSection
} from 'paperback-extensions-common'
import {
    decode,
    getToken
} from './JMHelper'
import { Parser } from './JMParser'

export const BASE_URL = 'https://www.jmapibranch3.cc/'
const USERAGENT = 'okhttp/3.12.1'
const ACCEPT_ENCODING = 'gzip'
const KEY = '0b931a6f4b5ccc3f8d870839d07ae7b2'
const VIEW_MODE = 'null'
const VIEW_MODE_DEBUG = '1'
const COMICNAME = 'fav'

export const JMInfo: SourceInfo = {
    version: '0.1.0',
    name: '禁漫天堂',
    description: '禁漫天堂',
    author: 'kpwa',
    authorWebsite: 'https://github.com/kpmulillyc',
    icon: 'favicon.ico',
    websiteBaseURL: BASE_URL,
    sourceTags: [
        {
            text: 'Notifications',
            type: TagType.GREEN
        }
    ],
    contentRating: ContentRating.ADULT,
}

const headers = {
    'user-agent': USERAGENT,
    'accept-encoding': ACCEPT_ENCODING
}

export class JM extends Source {
    requestManager = createRequestManager({
        requestsPerSecond: 4,
        requestTimeout: 60000,
        interceptor: {
            interceptRequest: async (request: Request): Promise<Request> => {
                return request
            },

            interceptResponse: async (response: Response): Promise<Response> => {
                return response
            }
        }
    })
    baseUrl = BASE_URL
    parser = new Parser()

    override getMangaShareUrl(mangaId: string): string {
        return `${BASE_URL}${mangaId}`
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const getMangaUrl = `${this.baseUrl}album`
        const request = createRequestObject({
            url: getMangaUrl,
            param: `?key=${KEY}&view_mode_debug=${VIEW_MODE_DEBUG}&view_mode=${VIEW_MODE}&comicName=${COMICNAME}&id=${mangaId}`,
            headers: { ...headers, ...getToken() },
            method: 'GET'
        })
        const json = await this.requestManager.schedule(request, 1)
        const data = JSON.parse(json.data).data
        return this.parser.parseMangaDetails(data, mangaId)
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        const getMangaUrl = `${this.baseUrl}album`
        const request = createRequestObject({
            url: getMangaUrl,
            param: `?key=${KEY}&view_mode_debug=${VIEW_MODE_DEBUG}&view_mode=${VIEW_MODE}&comicName=${COMICNAME}&id=${mangaId}`,
            headers: { ...headers, ...getToken() },
            method: 'GET'
        })
        const json = await this.requestManager.schedule(request, 1)
        const data = JSON.parse(json.data).data
        const chapters = this.parser.parseChapterList(data, mangaId)
        return chapters
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const detailsUrl = 'https://jmapi.kpmuwa.com/getImages'
        const request = createRequestObject({
            url: detailsUrl,
            param: `?chapterId=${chapterId}`,
            method: 'GET',
        })
        const data = await this.requestManager.schedule(request, 1)
        return this.parser.parseChapterDetails(data.data, mangaId, chapterId)
    }




    async getSearchResults(query: SearchRequest, metadata: any,): Promise<PagedResults> {
        const url = `${this.baseUrl}search`
        const page: number = metadata?.page ?? 1
        const start: number = metadata?.start ?? 0
        const total: number = metadata?.total ?? 0
        const request = createRequestObject({
            url: url,
            headers: { ...headers, ...getToken() },
            method: 'GET'
        })
        if (query.title)
            request.param = `?key=${KEY}&view_mode_debug=${VIEW_MODE_DEBUG}&view_mode=${VIEW_MODE}&o=mr&search_query=${encodeURIComponent(query.title!)}&page=${page}`
        const json = await this.requestManager.schedule(request, 1)
        const data = JSON.parse(json.data).data
        const decodedData = decode(data)
        const resultTotal = JSON.parse(decodedData).total - 1
        const results = this.parser.parseSearchResult(decodedData, start, resultTotal)
        metadata = metadata?.start >= 80 ? { page: page + 1, start: 0, total: total + 10 } : { page: page, start: start + 10, total: total + 10 }
        if (total >= resultTotal) metadata = undefined
        return createPagedResults({
            results,
            metadata
        })

    }

    override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const getMangaUrl = `${this.baseUrl}categories/filter`
        const sections = [
            {
                request: createRequestObject({
                    url: getMangaUrl,
                    param: `?key=${KEY}&view_mode_debug=${VIEW_MODE_DEBUG}&view_mode=${VIEW_MODE}&o=mv&c=0&order=`,
                    headers: { ...headers, ...getToken() },
                    method: 'GET'
                }),
                section: createHomeSection({
                    id: 'hot',
                    title: '熱門',
                    view_more: true,
                    type: HomeSectionType.singleRowNormal
                }),
            },
            {
                request: createRequestObject({
                    url: getMangaUrl,
                    param: `?key=${KEY}&view_mode_debug=${VIEW_MODE_DEBUG}&view_mode=${VIEW_MODE}&o=mr&c=hanman`,
                    headers: { ...headers, ...getToken() },
                    method: 'GET'
                }),
                section: createHomeSection({
                    id: 'korea',
                    title: '韓漫',
                    view_more: true,
                    type: HomeSectionType.singleRowNormal
                }),
            },
            {
                request: createRequestObject({
                    url: getMangaUrl,
                    param: `?key=${KEY}&view_mode_debug=${VIEW_MODE_DEBUG}&view_mode=${VIEW_MODE}&o=mr`,
                    headers: { ...headers, ...getToken() },
                    method: 'GET'
                }),
                section: createHomeSection({
                    id: 'aman',
                    title: 'A漫',
                    view_more: true,
                    type: HomeSectionType.singleRowNormal
                }),
            },
            {
                request: createRequestObject({
                    url: getMangaUrl,
                    param: `?key=${KEY}&view_mode_debug=${VIEW_MODE_DEBUG}&view_mode=${VIEW_MODE}&o=mr&c=doujin`,
                    headers: { ...headers, ...getToken() },
                    method: 'GET'
                }),
                section: createHomeSection({
                    id: 'douren',
                    title: '同人',
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
        const page: number = metadata?.page ?? 1
        const start: number = metadata?.start ?? 0
        const total: number = metadata?.total ?? 0
        const getMangaUrl = `${this.baseUrl}categories/filter`
        const request = createRequestObject({
            url: getMangaUrl,
            headers: { ...headers, ...getToken() },
            method: 'GET'
        })
        switch (homepageSectionId) {
            case 'hot':
                request.param = `?key=${KEY}&view_mode_debug=${VIEW_MODE_DEBUG}&view_mode=${VIEW_MODE}&o=mv&c=0&order=&page=${page}`
                break
            case 'korea':
                request.param = `?key=${KEY}&view_mode_debug=${VIEW_MODE_DEBUG}&view_mode=${VIEW_MODE}&o=mr&c=hanman&page=${page}`

                break
            case 'aman':
                request.param = `?key=${KEY}&view_mode_debug=${VIEW_MODE_DEBUG}&view_mode=${VIEW_MODE}&o=mr&page=${page}`

                break
            case 'douren':
                request.param = `?key=${KEY}&view_mode_debug=${VIEW_MODE_DEBUG}&view_mode=${VIEW_MODE}&o=mr&c=doujin&page=${page}`

                break
            default:
                throw new Error('Requested to getViewMoreItems for a section ID which doesn\'t exist')
        }
        const json = await this.requestManager.schedule(request, 1)
        const data = JSON.parse(json.data).data
        const decodedData = decode(data)
        const resultTotal = JSON.parse(decodedData).total -1
        const results = this.parser.parseViewMore(decodedData, start,resultTotal)
        metadata = metadata?.start >= 80 ? { page: page + 1, start: 0, total: total + 10 } : { page: page, start: start + 10, total: total + 10 }
        if (total >= resultTotal) metadata = undefined
        return createPagedResults({
            results,
            metadata
        })
    }



    override async getTags(): Promise<TagSection[]> {
        const getMangaUrl = `${this.baseUrl}categories`
        const request = createRequestObject({
            url: getMangaUrl,
            param: `?key=${KEY}&view_mode_debug=${VIEW_MODE_DEBUG}&view_mode=${VIEW_MODE}`,
            headers: { ...headers, ...getToken() },
            method: 'GET'
        })

        const json = await this.requestManager.schedule(request, 1)
        const data = JSON.parse(json.data).data
        const decodedData = decode(data)
        return this.parser.parseTags(decodedData) || []
    }

}