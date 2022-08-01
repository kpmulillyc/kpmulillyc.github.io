import {
    Chapter, ChapterDetails, LanguageCode, Manga, MangaStatus, MangaTile, Tag, TagSection
} from 'paperback-extensions-common'

const OpenCC = require('opencc-js');

const converter = OpenCC.Converter({ from: 'cn', to: 'hk' });

export interface UpdatedManga {
    ids: string[];
    loadMore: boolean;
}

export class Parser {

    parseMangaDetails($: any, mangaId: string): Manga {
        const parsedData = JSON.parse($).response
        const desc = converter(parsedData.mangaIntro)
        const status = this.mangaStatus(parsedData.mangaIsOver)
        const author = converter(parsedData.mangaAuthor)
        const titles = converter(parsedData.mangaName)
        const image = parsedData.mangaCoverimageUrl || "http://mhfm5.tel.cdndm5.com/tag/category/nopic.jpg"
        const rating = parsedData.mangaGrade

        const tagArray: Tag[] = []
        let tagId=1
        const genres = converter(parsedData.mangaTheme)
        genres.split(' ').forEach((tag:any) => {
            tagArray.push({id:tagId.toString(),label:tag})
            tagId++
        });
        const tags: TagSection[] = [createTagSection({ id: "0", label: "genres", tags: tagArray.map(x => createTag(x)) })]

        const views = parsedData.mangaHot
        const lastUpdate = parsedData.mangaNewestTime
        const covers = parsedData.mangaPicimageUrl || "http://mhfm5.tel.cdndm5.com/tag/category/nopic.jpg"
        const langFlag = LanguageCode.CHINEESE_HONGKONG
        return createManga({
            id: mangaId,
            image,
            desc,
            status,
            author,
            titles: [titles],
            rating,
            tags,
            views,
            lastUpdate,
            covers,
            langFlag
        })
    }


    parseUpdatedManga = ($: any, time: Date, id: string, updatedManga: string[]): void => {
        const parsedData = JSON.parse($).response
        const date = new Date(parsedData.mangaNewestTime)
        if (date > time)
            updatedManga.push(id)
    }


    mangaStatus(status: any) {
        if (status == '0') return MangaStatus.ONGOING
        if (status == '1') return MangaStatus.COMPLETED
        return MangaStatus.UNKNOWN
    }

    parseChapterList($: any, mangaId: string): Chapter[] {
        const parsedData = JSON.parse($).response
        const chapters: Chapter[] = []
        parsedData.mangaWords.forEach((obj: any) => {
            const id = obj.sectionId.toString()
            const name = obj.isMustPay == 1 ? "鎖 " : "" + this.getChapterName("mangaWords", obj.sectionName, obj.sectionTitle)
            const time: Date = new Date(obj.releaseTime)
            const chapNum = parseFloat(obj.sectionSort)
            chapters.push(createChapter({
                id,
                mangaId,
                chapNum,
                langCode: LanguageCode.CHINEESE_HONGKONG,
                name,
                time
            }))
        });
        parsedData.mangaRolls.forEach((obj: any) => {
            const id = obj.sectionId.toString()
            const name = obj.isMustPay == 1 ? "鎖" : "" + this.getChapterName("mangaWords", obj.sectionName, obj.sectionTitle)
            const time: Date = new Date(obj.releaseTime)
            const chapNum = parseFloat(obj.sectionSort)
            chapters.push(createChapter({
                id,
                mangaId,
                chapNum,
                langCode: LanguageCode.CHINEESE_HONGKONG,
                name,
                time
            }))
        });
        parsedData.mangaEpisode.forEach((obj: any) => {
            const id = obj.sectionId.toString()
            const name = obj.isMustPay == 1 ? "鎖" : "" + this.getChapterName("mangaWords", obj.sectionName, obj.sectionTitle)
            const time: Date = new Date(obj.releaseTime)
            const chapNum = parseFloat(obj.sectionSort)
            chapters.push(createChapter({
                id,
                mangaId,
                chapNum,
                langCode: LanguageCode.CHINEESE_HONGKONG,
                name,
                time
            }))
        });
        return chapters
    }

    parseSearchResult($: any): MangaTile[] {
        const result: MangaTile[] = []
        const parsedData = JSON.parse($)
        for (let obj of parsedData.response.result) {
            const id: string = obj.mangaId.toString()
            const title = createIconText({ text: converter(obj.mangaName) })
            const image = obj.mangaPicimageUrl || "http://mhfm5.hk.cdndm5.com/tag/category/nopic.jpg"
            const subtitle = obj.mangaNewestContent
            result.push(createMangaTile({
                id: id,
                title: title,
                subtitleText: createIconText({ text: subtitle }),
                image: image
            }))
        }
        return result
    }

    parseChapterDetails($: any, mangaId: string, chapterId: string): ChapterDetails {
        const parsedData = JSON.parse($).response
        const pages: string[] = []
        const hostList = parsedData.hostList[0]
        const query = parsedData.query
        parsedData.mangaSectionImages.forEach((obj: any) => {
            pages.push(`${hostList}${obj}${query}`)
        });
        return createChapterDetails({
            id: chapterId,
            mangaId,
            pages,
            longStrip: false
        })
    }


    parseHomeSection($: any): MangaTile[] {
        const tiles: MangaTile[] = []
        const parsedData = JSON.parse($).response
        parsedData.mangas.forEach((obj: any) => {
            const id: string = obj.mangaId.toString()
            const title = createIconText({ text: converter(obj.mangaName) })
            const image = obj.mangaPicimageUrl || "http://mhfm5.hk.cdndm5.com/tag/category/nopic.jpg"
            const subtitle = obj.mangaNewestContent
            tiles.push(createMangaTile({
                id: id,
                title: title,
                subtitleText: createIconText({ text: subtitle }),
                image: image
            }))
        });
        return tiles
    }


    parseViewMore($: any): MangaTile[] {
        const tiles: MangaTile[] = []
        const parsedData = JSON.parse($).response
        parsedData.mangas.forEach((obj: any) => {
            const id: string = obj.mangaId.toString()
            const title = createIconText({ text: converter(obj.mangaName) })
            const image = obj.mangaPicimageUrl || "http://mhfm5.hk.cdndm5.com/tag/category/nopic.jpg"
            const subtitle = obj.mangaNewestContent
            tiles.push(createMangaTile({
                id: id,
                title: title,
                subtitleText: createIconText({ text: subtitle }),
                image: image
            }))
        });
        return tiles
    }

    getChapterName(type: string, name: string, title: string): string {
        let final = ""
        final += type == "mangaEpisode" ? "[番外] " : ""
        final += converter(name)
        final += title == "" ? "" : converter(title)
        return final
    }

    isLastPage($: any, home: boolean) {
        const parsedData = JSON.parse($).response
        if (home)
            return parsedData.mangas.length === 20 ? false : true
        return parsedData.result.length === 20 ? false : true
    }
}
