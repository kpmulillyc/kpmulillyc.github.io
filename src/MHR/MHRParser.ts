import {
    Chapter, ChapterDetails, LanguageCode, Manga, MangaStatus, MangaTile
} from 'paperback-extensions-common'


export class Parser {


    parseMangaDetails($: any, mangaId: string): Manga {
        const parsedData = JSON.parse($).response
        const desc = parsedData.mangaIntro.toString()
        const status = this.mangaStatus(parsedData.mangaIsOver)
        const author = parsedData.mangaAuthor.toString()
        const titles = parsedData.mangaName.toString()
        const image = parsedData.mangaPicimageUrl.toString()
        const rating = parsedData.mangaGrade
        const tags = parsedData.mangaTheme
        const views = parsedData.mangaHot
        const lastUpdate = parsedData.mangaNewestTime
        const covers = parsedData.mangaCoverimageUrl
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

    mangaStatus(status: any) {
        if (status == '0') return MangaStatus.ONGOING
        if (status == '1') return MangaStatus.COMPLETED
        return MangaStatus.UNKNOWN
    }

    parseChapterList($: any, mangaId: string): Chapter[] {
        const parsedData = JSON.parse($).response
        const chapters: Chapter[] = []
        let chapNum = 1
        parsedData.mangaWords.forEach((obj: any) => {
            const id = obj.sectionId.toString()
            const name = `${obj.sectionName} ${obj.sectionTitle}`
            const time: Date = new Date(obj.releaseTime)
            chapters.push(createChapter({
                id,
                mangaId,
                chapNum: chapNum++,
                langCode: LanguageCode.CHINEESE_HONGKONG,
                name,
                time
            }))
        });
        parsedData.mangaRolls.forEach((obj: any) => {
            const id = obj.sectionId.toString()
            const name = `${obj.sectionName} ${obj.sectionTitle}`
            const time: Date = new Date(obj.releaseTime)
            chapters.push(createChapter({
                id,
                mangaId,
                chapNum: chapNum++,
                langCode: LanguageCode.CHINEESE_HONGKONG,
                name,
                time
            }))
        });
        parsedData.mangaEpisode.forEach((obj: any) => {
            const id = obj.sectionId.toString()
            const name = `${obj.sectionName} ${obj.sectionTitle}`
            const time: Date = new Date(obj.releaseTime)
            chapters.push(createChapter({
                id,
                mangaId,
                chapNum: chapNum++,
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
            const title = createIconText({ text: obj.mangaName })
            const image = obj.mangaCoverimageUrl.toString()
            result.push(createMangaTile({
                id: id,
                title: title,
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
            const title = createIconText({ text: obj.mangaName })
            const image = obj.mangaCoverimageUrl.toString()
            tiles.push(createMangaTile({
                id: id,
                title: title,
                image: image
            }))
        });
        return tiles
    }

}
