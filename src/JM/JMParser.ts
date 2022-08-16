
import {
    Chapter,
    ChapterDetails,
    LanguageCode,
    Manga,
    MangaStatus,
    MangaTile,
    Tag,
    TagSection
} from 'paperback-extensions-common'
import { decode } from './JMHelper'


const COVER_BASEURL = 'https://cdn-msp.jmapiproxy1.cc/media/albums/'

export interface UpdatedManga {
    ids: string[];
    loadMore: boolean;
}

export class Parser {

    parseMangaDetails($: string, mangaId: string): Manga {
        const decodedData = decode($)
        const parsedData = JSON.parse(decodedData)
        const desc = parsedData.description
        let status = MangaStatus.COMPLETED
        let authors = ''
        for (const author of parsedData.author) {
            authors += author + ', '
        }
        const titles = parsedData.name
        const image = `${COVER_BASEURL}${mangaId}_3x4.jpg`

        const tagArray: Tag[] = []
        let tagId = 1
        const genres = parsedData.tags
        genres.forEach((tag: string) => {
            if (tag === '連載中')
                status = MangaStatus.ONGOING
            tagArray.push({ id: (tagId++).toString(), label: tag })
        })
        const tags: TagSection[] = [createTagSection({ id: '0', label: 'genres', tags: tagArray.map(x => createTag(x)) })]

        const views = parsedData.total_views
        const langFlag = LanguageCode.CHINEESE_HONGKONG
        return createManga({
            id: mangaId,
            image,
            desc,
            status,
            author: authors.slice(0, -2),
            titles: [titles],
            tags,
            views,
            langFlag
        })
    }




    parseChapterList($: string, mangaId: string): Chapter[] {
        const decodedData = decode($)
        const parsedData = JSON.parse(decodedData)
        const chapters: Chapter[] = []
        if (parsedData.series.length === 0) {
            chapters.push(createChapter({
                id: mangaId,
                mangaId,
                chapNum: 0,
                langCode: LanguageCode.CHINEESE_HONGKONG,
                name: "開始閱讀"
            }))
            return chapters
        }
        parsedData.series.forEach((obj: any) => {
            const id = obj.id
            const name = obj.name
            const chapNum = parseFloat(obj.sort)
            chapters.push(createChapter({
                id,
                mangaId,
                chapNum,
                langCode: LanguageCode.CHINEESE_HONGKONG,
                name,
            }))
        })
        return chapters
    }




    parseSearchResult($: string, start: number, total: number): MangaTile[] {
        const result: MangaTile[] = []
        const parsedData = JSON.parse($).content
        for (let i = start; i < start + 10; i++) {
            if (i != 0 && i >= total) break
            const id: string = parsedData[i].id
            const title = createIconText({ text: parsedData[i].name })

            const image = `${COVER_BASEURL}${parsedData[i].id}_3x4.jpg`
            result.push(createMangaTile({
                id: id,
                title: title,
                image: image
            }))
        }
        return result
    }

    parseChapterDetails($: string, mangaId: string, chapterId: string): ChapterDetails {
        const parsedData = JSON.parse($)
        const pages: string[] = []
        parsedData.urls.forEach((obj: any) => {
            pages.push(obj)
        })
        return createChapterDetails({
            id: chapterId,
            mangaId,
            pages,
            longStrip: true
        })
    }


    parseHomeSection($: string, id: number): MangaTile[] {
        const tiles: MangaTile[] = []
        const parsedJson = JSON.parse($)
        const decodedData = decode(parsedJson.data)
        let parsedData
        if (id === 100)
            parsedData = JSON.parse(decodedData).content
        else
            parsedData = JSON.parse(decodedData)[id].content

        for (let i = 0; i < 5; i++) {
            tiles.push(createMangaTile({
                id: parsedData[i].id,
                title: createIconText({ text: parsedData[i].name }),
                subtitleText: createIconText({ text: parsedData[i].category.title }),
                image: `${COVER_BASEURL}${parsedData[i].id}_3x4.jpg`
            }))
        }
        return tiles
    }


    parseViewMore($: string, start: number, total: number, id: number): MangaTile[] {
        const tiles: MangaTile[] = []
        let parsedData
        if (id === 100)
            parsedData = JSON.parse($).content
        else
            parsedData = JSON.parse($)[id].content
        for (let i = start; i < start + 10; i++) {
            if (i >= total) break
            tiles.push(createMangaTile({
                id: parsedData[i].id,
                title: createIconText({ text: parsedData[i].name }),
                subtitleText: createIconText({ text: parsedData[i].category.title }),
                image: `${COVER_BASEURL}${parsedData[i].id}_3x4.jpg`
            }))
        }
        return tiles
    }

    parseTags($: string): TagSection[] | null {
        const arrayTags: Tag[] = []
        const parsedData = JSON.parse($).blocks
        parsedData.forEach((obj: any) => {
            obj.content.forEach((tag: string) => {
                arrayTags.push({ id: tag, label: tag })
            })
        })
        const tagSections: TagSection[] = [createTagSection({ id: '0', label: '分類', tags: arrayTags.map(x => createTag(x)) })]
        return tagSections
    }

}
