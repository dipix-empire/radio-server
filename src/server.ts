import bodyParser from "body-parser"
import express from "express"
import Bot from "./bot"

const errors = {
    "ok": {
        "error": 0,
        "msg": "ok.",
    },

    "apiTokenNotValid": {
        "error": 101,
        "msg": "api token not valid",
    },
    "botTokenNotValid": {
        "error": 102,
        "msg": "bot token not valid",
    },
    "dataNotValid": {
        "error": 103,
        "msg": "post data not valid",
    },
    "botKeyNotValid": {
        "error": 104,
        "msg": "bot key not valid",
    },
    "channelIDNotValid": {
        "error": 105,
        "msg": "channelID not valid",
    },
    "guildIDNotValid": {
        "error": 106,
        "msg": "guildID not valid",
    },
    "streamTypeNotValid": {
        "error": 107,
        "msg": "streamType not valid",
    },

    "notConnectToChannel": {
        "error": 201,
        "msg": "not connect to channel"
    },
}

class Server {
    private app: express.Application = express()
    private bots: Map<string, Bot> = new Map<string, Bot>

    public start() {
        this.app.use(bodyParser.json())
        this.app.use(bodyParser.urlencoded({ extended: false }))

        this.app.get("/ping", (req: express.Request, res: express.Response) => {})

        this.app.route("/bot")
            .get((req: express.Request, res: express.Response)=>{this.botGet(req, res)})
            .put((req: express.Request, res: express.Response)=>{this.botUpdate(req, res)})
            .post((req: express.Request, res: express.Response)=>{this.botNew(req, res)})
        
        this.app.route("/queue")
            .get((req: express.Request, res: express.Response)=>{this.queueGet(req, res)})
            .post((req: express.Request, res: express.Response)=>{this.queueSet(req, res)})
            .delete((req: express.Request, res: express.Response)=>{this.queueRemove(req, res)})

        this.app.route("/stream")
            .put((req: express.Request, res: express.Response)=>{this.streamChangeType(req, res)})
            .post((req: express.Request, res: express.Response)=>{this.streamNew(req, res)})
            .delete((req: express.Request, res: express.Response)=>{this.streamStop(req, res)})
        

        this.app.listen(this.port, () => {
            console.log("Server started!")
        })
    }


    // bot operation
    public async botGet(req: express.Request, res: express.Response) {
        const apiToken: string = req.headers["api-token"] as string
        if (apiToken != this.apiToken) {res.send(JSON.stringify(errors.apiTokenNotValid)); return}

        let response: { key: string; token: string; name: string | undefined }[] = []
        for await (const obj of this.bots) {
            const key: string = obj[0]
            const bot: Bot = obj[1]

            response.push({"key": key, "token": await bot.getToken(), "name": await bot.getName()})
        }

        res.send(JSON.stringify({"error": 0, "data": response, "msg": "ok."}))
    }
    public async botUpdate(req: express.Request, res: express.Response) {
        const apiToken: string = req.headers["api-token"] as string
        if (apiToken != this.apiToken) {res.send(JSON.stringify(errors.apiTokenNotValid)); return}

        const botToken: string = req.body["bot-token"] as string
        const botKey: string = req.body["bot-key"] as string

        const bot: Bot = new Bot(botToken)
        try {
            await bot.start()
        } catch (error) {
            console.log(error)
            res.send(JSON.stringify(errors.botTokenNotValid))

            return
        }
        
        this.bots.set(`${botKey}`, bot)

        res.send(JSON.stringify({"error": 0, "bot-key": botKey, "msg": "ok"}))
    }
    public async botNew(req: express.Request, res: express.Response) {
        const apiToken: string = req.headers["api-token"] as string
        if (apiToken != this.apiToken) {res.send(JSON.stringify(errors.apiTokenNotValid)); return}

        const botToken: string = req.body["bot-token"] as string

        const bot: Bot = new Bot(botToken)
        try {
            await bot.start()
        } catch (error) {
            console.log(error)
            res.send(JSON.stringify(errors.botTokenNotValid))

            return
        }

        const botKey: number = this.bots.size+1
        this.bots.set(`${botKey}`, bot)

        res.send(JSON.stringify({"error": 0, "bot-key": botKey, "msg": "ok"}))
    }

    // queue operation
    public async queueGet(req: express.Request, res: express.Response) {
        const apiToken: string = req.headers["api-token"] as string
        if (apiToken != this.apiToken) {res.send(JSON.stringify(errors.apiTokenNotValid)); return}

        const botKey: string = req.query["bot-key"] as string
        const bot: Bot | undefined = this.bots.get(botKey)
        if (!bot) {res.send(JSON.stringify(errors.botKeyNotValid)); return}

        const type: string = req.query["type"] as string

        let response: any = []
        switch (type) {
            case "news":
                response = await bot.getAllNews()

                res.send(JSON.stringify({"error":0,"data": response, "msg":"ok."}))

                return
            case "music":
                response = await bot.getAllMusic()

                res.send(JSON.stringify({"error":0,"data": response, "msg":"ok."}))

                return
            default:
                console.log(`type ${type} not support`)
                res.send(JSON.stringify(errors.streamTypeNotValid))

                return
        }
    }
    public async queueSet(req: express.Request, res: express.Response) {
        const apiToken: string = req.headers["api-token"] as string
        if (apiToken != this.apiToken) {res.send(JSON.stringify(errors.apiTokenNotValid)); return}

        const botKey: string = req.body["bot-key"] as string
        const bot: Bot | undefined = this.bots.get(botKey)
        if (!bot) {res.send(JSON.stringify(errors.botKeyNotValid)); return}

        const type: string = req.body["type"] as string
        const link: string = req.body["link"] as string
        switch (type) {
            case "news":
                await bot.addNews(link)

                break
            case "music":
                await bot.addMusic(link)

                break
            default:
                console.log(`type ${type} not support`)
                res.send(JSON.stringify(errors.streamTypeNotValid))

                return
        }

        res.send(JSON.stringify(errors.ok))
    }
    public async queueRemove(req: express.Request, res: express.Response) {
        const apiToken: string = req.headers["api-token"] as string
        if (apiToken != this.apiToken) {res.send(JSON.stringify(errors.apiTokenNotValid)); return}

        const botKey: string = req.body["bot-key"] as string
        const bot: Bot | undefined = this.bots.get(botKey)
        if (!bot) {res.send(JSON.stringify(errors.botKeyNotValid)); return}

        const queueIndex: number = req.body["queue-index"] as number
        const type: string = req.body["type"] as string

        switch (type) {
            case "news":
                if (queueIndex < 0) {
                    await bot.removeAllNews()

                    break
                }
                await bot.removeNews(queueIndex)

                break
            case "music":
                if (queueIndex < 0) {
                    await bot.removeAllMusic()

                    break
                }
                await bot.removeMusic(queueIndex)

                break
            case "all": 
                await bot.removeAll()

                break
            default:
                console.log(`type ${type} not support`)
                res.send(JSON.stringify(errors.streamTypeNotValid))

                return
        }

        res.send(JSON.stringify(errors.ok))
    }

    // stream operation
    public async streamNew(req: express.Request, res: express.Response) {
        const apiToken: string = req.headers["api-token"] as string
        if (apiToken != this.apiToken) {res.send(JSON.stringify(errors.apiTokenNotValid)); return}

        const channelID: string = req.body["channel-id"] as string
        if (channelID === "") {res.send(JSON.stringify(errors.channelIDNotValid)); return}
        const guildID: string = req.body["guild-id"] as string
        if (guildID === "") {res.send(JSON.stringify(errors.channelIDNotValid)); return}

        const botKey: string = req.body["bot-key"] as string
        const bot: Bot | undefined = this.bots.get(botKey)
        if (!bot) {res.send(JSON.stringify(errors.botKeyNotValid)); return}

        if (!bot.connect(guildID, channelID)) {res.send(JSON.stringify(errors.notConnectToChannel)); return}

        res.send(JSON.stringify(errors.ok))
    }
    public async streamChangeType(req: express.Request, res: express.Response) {
        const apiToken: string = req.headers["api-token"] as string
        if (apiToken != this.apiToken) {res.send(JSON.stringify(errors.apiTokenNotValid)); return}

        const botKey: string = req.body["bot-key"] as string
        const bot: Bot | undefined = this.bots.get(botKey)
        if (!bot) {res.send(JSON.stringify(errors.botKeyNotValid)); return}

        const type: string = req.body["type"] as string

        switch (type) {
            case "news":
                await bot.changeStremType(0)

                break
            case "music":
                await bot.changeStremType(1)

                break
            default:
                console.log(`type ${type} not support`)
                res.send(JSON.stringify(errors.streamTypeNotValid))

                return
        }

        res.send(JSON.stringify(errors.ok))
    }
    public async streamStop(req: express.Request, res: express.Response) {
        const apiToken: string = req.headers["api-token"] as string
        if (apiToken != this.apiToken) {res.send(JSON.stringify(errors.apiTokenNotValid)); return}

        const botKey: string = req.body["bot-key"] as string
        const bot: Bot | undefined = this.bots.get(botKey)
        if (!bot) {res.send(JSON.stringify(errors.botKeyNotValid)); return}

        await bot.stopPlayer()

        res.send(JSON.stringify(errors.ok))
    }

    public constructor(
        private apiToken: string, 
        private port: number
    ) {}
}

export default Server