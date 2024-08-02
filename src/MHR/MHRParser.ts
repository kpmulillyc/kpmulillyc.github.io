import { Chapter, ChapterDetails,  SourceManga,  PartialSourceManga, Tag, TagSection } from "@paperback/types";
const OpenCC = require("opencc-js");
const converter = OpenCC.Converter({ from: "cn", to: "hk" });
export interface UpdatedManga {
    ids: string[];
    loadMore: boolean;
}
export class Parser {
    parseMangaDetails($: any, mangaId: string): SourceManga {
        const parsedData = JSON.parse($).response;
        const desc = converter(parsedData.mangaIntro);
        const status = this.mangaStatus(parsedData.mangaIsOver);
        const author = converter(parsedData.mangaAuthors.toString());
        const titles = converter(parsedData.mangaName);
        const image = parsedData.mangaCoverimageUrl || "http://mhfm5.hk.cdndm5.com/tag/category/nopic.jpg";
        const rating = parsedData.mangaGrade;
        const tagArray: Tag[] = [];
        let tagId = 1;
        const genres = converter(parsedData.mangaTheme);
        genres.split(" ").forEach((tag: any) => {
            tagArray.push({ id: tagId.toString(), label: tag });
            tagId++;
        });
        const tags: TagSection[] = [App.createTagSection({ id: "0", label: "genres", tags: tagArray.map(x => App.createTag(x)) })];
        const views = parsedData.mangaHot;
        const lastUpdate = parsedData.mangaNewestTime;
        const covers = parsedData.mangaPicimageUrl || "http://mhfm5.hk.cdndm5.com/tag/category/nopic.jpg";
        const langFlag = '🇭🇰';
        return App.createSourceManga({
            id: mangaId,
            mangaInfo: App.createMangaInfo({
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
        });
    }
    parseUpdatedManga = ($: any, time: Date, ids: string[]): UpdatedManga => {
        const parsedData = JSON.parse($).response;
        const updatedManga: string[] = [];
        let loadMore = true;
        parsedData.mangas.forEach((obj: any) => {
            const id = obj.mangaId.toString();
            const mangaDate = new Date(obj.mangaNewestTime);
            if (mangaDate > time) {
                if (ids.includes(id)) {
                    updatedManga.push(id);
                }
            }
            else {
                loadMore = false;
            }
        });
        return {
            ids: updatedManga,
            loadMore
        };
    };
    mangaStatus(status: any) {
        if (status == "1")
            return 'Completed';
        return 'Ongoing';
    }
    parseChapterList($: any, mangaId: string): Chapter[] {
        const parsedData = JSON.parse($).response;
        const chapters: Chapter[] = [];
        parsedData.mangaWords.forEach((obj: any) => {
            const id = obj.sectionId.toString();
            const name = obj.isMustPay == 1 ? "\u9396 " : "" + this.getChapterName("mangaWords", obj.sectionName, obj.sectionTitle);
            const time: Date = new Date(obj.releaseTime);
            const chapNum = parseFloat(obj.sectionSort);
            chapters.push(App.createChapter({
                id,
                chapNum,
                langCode: '🇭🇰',
                name,
                time
            }));
        });
        parsedData.mangaRolls.forEach((obj: any) => {
            const id = obj.sectionId.toString();
            const name = obj.isMustPay == 1 ? "\u9396" : "" + this.getChapterName("mangaWords", obj.sectionName, obj.sectionTitle);
            const time: Date = new Date(obj.releaseTime);
            const chapNum = parseFloat(obj.sectionSort);
            chapters.push(App.createChapter({
                id,
                chapNum,
                langCode: '🇭🇰',
                name,
                time
            }));
        });
        parsedData.mangaEpisode.forEach((obj: any) => {
            const id = obj.sectionId.toString();
            const name = obj.isMustPay == 1 ? "\u9396" : "" + this.getChapterName("mangaWords", obj.sectionName, obj.sectionTitle);
            const time: Date = new Date(obj.releaseTime);
            const chapNum = parseFloat(obj.sectionSort);
            chapters.push(App.createChapter({
                id,
                chapNum,
                langCode: '🇭🇰',
                name,
                time
            }));
        });
        return chapters;
    }
    parseSearchResult($: any): PartialSourceManga[] {
        const result: PartialSourceManga[] = [];
        const parsedData = JSON.parse($);
        for (const obj of parsedData.response.result) {
            const id: string = obj.mangaId.toString();
            const title = converter(obj.mangaName);
            const image = obj.mangaCoverimageUrl || "http://mhfm5.hk.cdndm5.com/tag/category/nopic.jpg";
            result.push(App.createPartialSourceManga({
                title: title,
                image: image,
                mangaId: id,
                subtitle: undefined
            }));
        }
        return result;
    }
    parseChapterDetails($: any, mangaId: string, chapterId: string): ChapterDetails {
        const parsedData = JSON.parse($).response;
        const pages: string[] = [];
        const hostList = parsedData.hostList[0];
        const query = parsedData.query;
        parsedData.mangaSectionImages.forEach((obj: any) => {
            pages.push(`${encodeURI(hostList + obj)}${query}`);
        });
        return App.createChapterDetails({
            id: chapterId,
            mangaId,
            pages
        });
    }
    parseTags = (): TagSection[] | null => {
        const arrayTags: Tag[] = [];
        arrayTags.push({ id: "031", label: "\u71B1\u8840" });
        arrayTags.push({ id: "026", label: "\u6200\u611B" });
        arrayTags.push({ id: "01", label: "\u6821\u5712" });
        arrayTags.push({ id: "03", label: "\u767E\u5408" });
        arrayTags.push({ id: "027", label: "\u803D\u7F8E" });
        arrayTags.push({ id: "05", label: "\u507D\u5A18" });
        arrayTags.push({ id: "02", label: "\u5192\u96AA" });
        arrayTags.push({ id: "06", label: "\u8077\u5834" });
        arrayTags.push({ id: "08", label: "\u5F8C\u5BAE" });
        arrayTags.push({ id: "09", label: "\u6CBB\u6108" });
        arrayTags.push({ id: "025", label: "\u79D1\u5E7B" });
        arrayTags.push({ id: "010", label: "\u52F5\u5FD7" });
        arrayTags.push({ id: "011", label: "\u751F\u6D3B" });
        arrayTags.push({ id: "012", label: "\u6230\u722D" });
        arrayTags.push({ id: "017", label: "\u61F8\u7591" });
        arrayTags.push({ id: "033", label: "\u63A8\u7406" });
        arrayTags.push({ id: "037", label: "\u641E\u7B11" });
        arrayTags.push({ id: "014", label: "\u5947\u5E7B" });
        arrayTags.push({ id: "015", label: "\u9B54\u6CD5" });
        arrayTags.push({ id: "029", label: "\u6050\u6016" });
        arrayTags.push({ id: "020", label: "\u795E\u9B3C" });
        arrayTags.push({ id: "021", label: "\u840C\u7CFB" });
        arrayTags.push({ id: "04", label: "\u6B77\u53F2" });
        arrayTags.push({ id: "07", label: "\u7F8E\u98DF" });
        arrayTags.push({ id: "030", label: "\u540C\u4EBA" });
        arrayTags.push({ id: "034", label: "\u904B\u52D5" });
        arrayTags.push({ id: "036", label: "\u7D33\u58EB" });
        arrayTags.push({ id: "040", label: "\u6A5F\u7532" });
        arrayTags.push({ id: "235", label: "\u6E2F\u53F0" });
        arrayTags.push({ id: "236", label: "\u65E5\u97D3" });
        arrayTags.push({ id: "237", label: "\u5927\u9678" });
        arrayTags.push({ id: "252", label: "\u6B50\u7F8E" });
        arrayTags.push({ id: "061", label: "\u9650\u5236\u7D1A" });
        arrayTags.push({ id: "11", label: "\u5C11\u5E74\u5411" });
        arrayTags.push({ id: "12", label: "\u5C11\u5973\u5411" });
        arrayTags.push({ id: "13", label: "\u9752\u5E74\u5411" });
        const tagSections: TagSection[] = [App.createTagSection({ id: "0", label: "\u5206\u982A", tags: arrayTags.map(x => App.createTag(x)) })];
        return tagSections;
    };
    parseHomeSection($: any): PartialSourceManga[] {
        const tiles: PartialSourceManga[] = [];
        const parsedData = JSON.parse($).response;
        parsedData.mangas.forEach((obj: any) => {
            const id: string = obj.mangaId.toString();
            const title = converter(obj.mangaName);
            const image = obj.mangaCoverimageUrl || "http://mhfm5.hk.cdndm5.com/tag/category/nopic.jpg";
            const subtitle = converter(obj.mangaNewestContent);
            tiles.push(App.createPartialSourceManga({
                title: title,
                image: image,
                mangaId: id,
                subtitle: subtitle
            }));
        });
        return tiles;
    }
    parseViewMore($: any): PartialSourceManga[] {
        const tiles: PartialSourceManga[] = [];
        const parsedData = JSON.parse($).response;
        parsedData.mangas.forEach((obj: any) => {
            const id: string = obj.mangaId.toString();
            const title = converter(obj.mangaName);
            const image = obj.mangaCoverimageUrl || "http://mhfm5.hk.cdndm5.com/tag/category/nopic.jpg";
            const subtitle = converter(obj.mangaNewestContent);
            tiles.push(App.createPartialSourceManga({
                title: title,
                image: image,
                mangaId: id,
                subtitle: subtitle
            }));
        });
        return tiles;
    }
    getChapterName(type: string, name: string, title: string): string {
        let final = "";
        final += type == "mangaEpisode" ? "[\u756A\u5916] " : "";
        final += converter(name) + " ";
        final += title == "" ? "" : converter(title);
        return final;
    }
    isLastPage($: any, home: boolean) {
        const parsedData = JSON.parse($).response;
        if (home)
            return parsedData.mangas.length === 20 ? false : true;
        return parsedData.result.length === 20 ? false : true;
    }
}
