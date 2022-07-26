import {
    Chapter,
    HomeSection,
    HomeSectionType,
    LanguageCode,
    Manga,
    MangaStatus,
    MangaTile
} from 'paperback-extensions-common'
import { MHG_IMAGE_BASE_URL } from './MHG'
import LZString from 'lz-string'
//
export class Parser {

    parseMangaDetails($: CheerioSelector, mangaId: string): Manga {
        const mainTitle = $('div.book-title > h1').text().trim()
        const desc = $('div#intro-all').text().trim()
        const image = 'http://' + $('p.hcover > img').attr('src')?.replace('//', '') ?? ''
        const author = $('span:contains(漫畫作者) > a').text().trim()
        const status = this.mangaStatus($('div.book-detail > ul.detail-list > li.status > span > span').first().text())
        return createManga({
            id: mangaId,
            image,
            desc,
            status,
            author,
            titles: [mainTitle]
        })
    }

    mangaStatus(str: string) {
        if (str == '連載中') return MangaStatus.ONGOING
        if (str == '已完結') return MangaStatus.COMPLETED
        return MangaStatus.UNKNOWN
    }

    parseChapterList($: CheerioSelector, mangaId: string): Chapter[] {
        const chapters: Chapter[] = []
        const chapArray = $('ul > li > a.status0').toArray()
        chapArray.forEach(obj => {
            const chapterId = $(obj).attr('href')?.replace(`/comic/${mangaId}/`, '').replace('.html', '').trim()
            const chapName = $(obj).attr('title')?.trim()
            const chapNum = parseFloat((chapName!.match(/[\d.]+/) ?? ['0'])[0] ?? '0')
            if (typeof chapterId === 'undefined' || isNaN(chapNum)) return
            chapters.push(createChapter({
                id: chapterId,
                mangaId: mangaId,
                chapNum: Number(chapNum),
                langCode: LanguageCode.CHINEESE_HONGKONG,
                name: chapName,
            }))
        })
        return chapters
    }

    parseChapterDetails($: string): string[] {
        const pages: string[] = []
        const htmlMatch = $.match(/;\}\('(.*;)',(\d*),(\d*),'(.*)'\['/)!
        let tmp = ""
        if (htmlMatch !== undefined && htmlMatch[1] !== undefined && htmlMatch[2] !== undefined && htmlMatch[3] !== undefined && htmlMatch[4] !== undefined)
            tmp = this.decode(htmlMatch[1], htmlMatch[2], htmlMatch[3], LZString.decompressFromBase64(htmlMatch[4])?.split('|'))
        const jsonStr = tmp.substring(12, tmp.length - 12)
        const jsonObj = JSON.parse(jsonStr)
        const match = jsonObj.path.match(/(\/.*\/.*\/.*\/)(.*)\//)
        const path = match[1] + encodeURI(match[2])
        for (const index in jsonObj.files)
            pages.push(`${MHG_IMAGE_BASE_URL}${path}/${jsonObj.files[index]}?e=${jsonObj.sl.e}&m=${jsonObj.sl.m}`)
        return pages
    }
    decode(p: string, a: any, c: any, k: any, e: any = 0, d: any = {}) {
        e = function (c: any) { return (c < a ? '' : e(Math.floor(c / a))) + ((c = c % a) > 35 ? String.fromCharCode(c + 29) : c.toString(36)) }
        if (!''.replace(/^/, String)) { while (c--) d[e(c)] = k[c] || e(c); k = [function (e: any) { return d[e] }]; e = function () { return '\\w+' }; c = 1 } while (c--) if (k[c]) p = p.replace(new RegExp('\\b' + e(c) + '\\b', 'g'), k[c]); return p
    }

    parseHomeSections($: CheerioSelector, sectionCallback: (section: HomeSection) => void): void {
        const section1 = createHomeSection({ id: '1', title: '熱門連載漫畫', type: HomeSectionType.singleRowLarge, view_more: false })
        const section6 = createHomeSection({ id: '6', title: '日排行', type: HomeSectionType.singleRowNormal, view_more: false })
        const section7 = createHomeSection({ id: '7', title: '週排行', type: HomeSectionType.singleRowNormal, view_more: false })
        const section8 = createHomeSection({ id: '8', title: '月排行', type: HomeSectionType.singleRowNormal, view_more: false })
        const section2 = createHomeSection({ id: '2', title: '少女/愛情', type: HomeSectionType.singleRowNormal, view_more: false })
        const section3 = createHomeSection({ id: '3', title: '少年/熱血', type: HomeSectionType.singleRowNormal, view_more: false })
        const section4 = createHomeSection({ id: '4', title: '競技/體育', type: HomeSectionType.singleRowNormal, view_more: false })
        const section5 = createHomeSection({ id: '5', title: '武俠/格鬥', type: HomeSectionType.singleRowNormal, view_more: false })

        section1.items = this.handleHomeSection($, 'div#cmt-cont', 0, 12)
        sectionCallback(section1)
        section6.items = this.handleRankingSection($, 0, 10)
        sectionCallback(section6)
        section7.items = this.handleRankingSection($, 40, 50)
        sectionCallback(section7)
        section8.items = this.handleRankingSection($, 80, 90)
        sectionCallback(section8)
        section2.items = this.handleHomeSection($, 'div#serialCont', 0, 10)
        sectionCallback(section2)
        section3.items = this.handleHomeSection($, 'div#serialCont', 10, 20)
        sectionCallback(section3)
        section4.items = this.handleHomeSection($, 'div#serialCont', 20, 30)
        sectionCallback(section4)
        section5.items = this.handleHomeSection($, 'div#serialCont', 30, 40)
        sectionCallback(section5)
    }

    handleHomeSection($: any, className: string, start: number, end: number): MangaTile[] {
        const src = className == 'div#cmt-cont' ? 'src' : 'data-src'
        const tiles: MangaTile[] = []
        const ulArray = $(className).toArray()
        const bookList = $('img', ulArray[0]).toArray()
        for (let index = start; index < end; index++) {
            const title: string = $(bookList[index]).attr('alt')!
            const match = $(bookList[index]).attr(src)?.match(/\/\/cf.hamreus.com\/.+\/.+\/(\d*|\d*_\d*).jpg/)
            let id = match != null ? match[1]! : ''
            id = !id.includes('_') ? id : id.split('_')[0]
            const image = `http://${$(bookList[index]).attr(src)!.substring(2)}`
            tiles.push(createMangaTile({
                id,
                image,
                title: createIconText({
                    text: title
                }),
            })
            )
        }
        return tiles
    }

    handleRankingSection($: any, start: number, end: number): MangaTile[] {
        const tiles: MangaTile[] = []
        const ulArray = $('div#rankCont')
        const bookList = $('li > h6', ulArray).toArray()
        for (let index = start; index < end; index++) {
            const title: string = $(bookList[index]).children().attr('title')!
            const id = $(bookList[index]).children().attr('href').replace('/comic/', '').replace('/', '')
            const image = `http://cf.hamreus.com/cpic/b/${id}.jpg`
            tiles.push(createMangaTile({
                id,
                image,
                title: createIconText({
                    text: title
                }),
            })
            )
        }
        return tiles
    }

    parseSearchResult($: CheerioSelector): MangaTile[] {
        const tiles: MangaTile[] = []
        const mangaArray = $('dt').toArray()
        const coverArray = $('img').toArray()
        for (let index = 0; index < mangaArray.length; index++) {
            const title: string = $(mangaArray[index]).children().first().text()
            const id = $(mangaArray[index]).children().first().attr('href')!.replace('/comic/', '').replace('/', '')
            const image = `http://${$(coverArray[index]).attr('src')!.substring(2)}`
            tiles.push(createMangaTile({
                id,
                image,
                title: createIconText({
                    text: title
                }),
            })
            )
        }
        return tiles
    }

    // parseTags($: CheerioSelector): TagSection[] {
    //     const tagSections: TagSection[] = []
    //     const typeList: string[] = ['剧情', '进度', '地区', '字母']
    //     for (const obj in typeList) {
    //         const tagList = $('li', $(`label:contains(${typeList[obj]})`, $('div[class="filter-nav clearfix"]')).parent()).toArray()
    //         tagList.shift()
    //         tagSections.push(createTagSection({
    //             id: obj,
    //             label: typeList[obj],
    //             tags: tagList.map(element => {
    //                 return createTag({
    //                     id: $('a', element).attr('href')?.replace(/\/list\//g, '').replace(/\//g, '') ?? '',
    //                     label: $(element).text(),
    //                 })
    //             }),
    //         }))
    //     }
    //     return tagSections
    // }

    // getUpdatedManga($: CheerioSelector, time: Date): string[] {
    //     const updatedMange: string[] = []
    //     const mangaList = $('ul#contList').text() !== '' ? $('ul#contList') : $('ul[class="rank-list clearfix"]')
    //     for (const obj of $('li', mangaList).toArray()) {
    //         const mangaUrl = $('a', $('p.ell', $(obj))).attr('href')
    //         const mangaIdMatchObj = /(https?|http):\/\/www.90mh.com\/manhua\/([^\/]*)/.exec(mangaUrl ?? '')!
    //         if (mangaIdMatchObj.length !== 3) continue
    //         const mangaId = mangaIdMatchObj[2]
    //         const updateOn = $('span.updateon', obj).text()
    //         const dateInfo = /\D*(\d*)-(\d*)-(\d*)(.*)?/.exec(updateOn)
    //         const updateDate = new Date(
    //             +dateInfo?.[1]! ?? time.getFullYear(),
    //             +dateInfo?.[2]! ?? time.getMonth(),
    //             +dateInfo?.[3]! ?? time.getDay())
    //         if (updateDate > time) updatedMange.push(mangaId)
    //     }
    //     return updatedMange
    // }

    isLastPage($: CheerioSelector): boolean {
        const next = $('div.pager-cont').text().includes('下一頁')
        const result = next ? false : true
        return result
    }

}
