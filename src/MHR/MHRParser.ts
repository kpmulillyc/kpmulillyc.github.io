import {
    Chapter, ChapterDetails, LanguageCode, Manga, MangaStatus, MangaTile
} from 'paperback-extensions-common'


export class Parser {


    parseMangaDetails($: any, mangaId: string): Manga {
        const parsedData = JSON.parse($).response
        const desc = parsedData.mangaIntro
        const status = this.mangaStatus(parsedData.mangaIsOver)
        const author = parsedData.mangaAuthor
        const titles = parsedData.mangaName
        const image = parsedData.mangaPicimageUrl || "http://mhfm5.tel.cdndm5.com/tag/category/nopic.jpg"
        const rating = parsedData.mangaGrade
        const tags = parsedData.mangaTheme
        const views = parsedData.mangaHot
        const lastUpdate = parsedData.mangaNewestTime
        const covers = parsedData.mangaCoverimageUrl || "http://mhfm5.tel.cdndm5.com/tag/category/nopic.jpg"
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
        parsedData.mangaWords.forEach((obj: any) => {
            const id = obj.sectionId.toString()
            const name = this.getChapterName("mangaWords", obj.sectionName, obj.sectionTitle)
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
            const name = this.getChapterName("mangaRolls", obj.sectionName, obj.sectionTitle)
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
            const name = this.getChapterName("mangaEpisode", obj.sectionName, obj.sectionTitle)
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
            const title = createIconText({ text: obj.mangaName })
            const image = obj.mangaCoverimageUrl || "http://mhfm5.tel.cdndm5.com/tag/category/nopic.jpg"
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
            const image = obj.mangaCoverimageUrl || "http://mhfm5.tel.cdndm5.com/tag/category/nopic.jpg"
            tiles.push(createMangaTile({
                id: id,
                title: title,
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
            const title = createIconText({ text: obj.mangaName })
            const image = obj.mangaCoverimageUrl || "http://mhfm5.tel.cdndm5.com/tag/category/nopic.jpg"
            tiles.push(createMangaTile({
                id: id,
                title: title,
                image: image
            }))
        });
        return tiles
    }

    getChapterName(type: string, name: string, title: string): string {
        let final = ""
        final += type == "mangaEpisode" ? "[番外] " : ""
        final += name
        final += title == "" ? "" : title
        return final
    }

    isLastPage($: any, home: boolean) {
        const parsedData = JSON.parse($).response
        if (home)
            return parsedData.mangas.length === 20 ? false : true
        return parsedData.result.length === 20 ? false : true
    }
}
