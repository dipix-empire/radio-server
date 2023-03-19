import ytdl from "ytdl-core"

enum Stream {
    News = 0,
    Music = 1,
}

interface QueueObj {
    title: string
    link: string
}

class Queue {
    private news: QueueObj[] = []
    private music: QueueObj[] = []
    private streamType: Stream = Stream.Music
    private index: number = 0

    public getAllNews(): QueueObj[] {
        return this.news
    }
    public getAllMusic(): QueueObj[]{
        return this.music
    }
    public getNext(): QueueObj | undefined {
        const lastValue: number = this.index
        this.index = this.index + 1
        if (this.index > this.news.length-1) this.index = 0

        switch (this.streamType) {
            case Stream.News:
                console.log("Next streaming type: news")

                return this.news[this.index]
            case Stream.Music:
                console.log("Next streaming type: music")

                return this.music[this.index]
        
            default:
                this.index = lastValue
                
                return undefined
        }
    }

    public async addNews(link: string) {
        const info = await ytdl.getInfo(link)
        const result: QueueObj = {title: info.videoDetails.title, link: link}

        console.log(`Add new news. ${result.link} ${result.title}`)

        this.news.push(result)
    }
    public async removeNews(id: number) {
        if (id < 0) { return }
        if (id > this.news.length) { return }
        this.news.splice(id, 1)
    }

    public async addMusic(link: string) {
        const info = await ytdl.getInfo(link)
        const result: QueueObj = {title: info.videoDetails.title, link: link}

        console.log(`Add new music. ${result.link} ${result.title}`)

        this.music.push(result)
    }
    public async removeMusic(id: number) {
        if (id < 0) { return }
        if (id > this.music.length) { return }
        this.music.splice(id, 1)
    }

    public async removeAllNews() {
        this.news = []
    }
    public async removeAllMusic() {
        this.music = []
    }
    public async removeAll() {
        this.news = []
        this.music = []
    }

    public async changeStreamType(type: number) {
        if (type < 0) return
        if (type > 1) return
        this.streamType = type
    }
}

export default Queue