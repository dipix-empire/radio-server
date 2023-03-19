import { Channel, Client, GatewayIntentBits, Guild, VoiceChannel } from 'discord.js'
import { Player } from 'discordaudio'
import Queue from './queue'

class Bot {
    private token: string
    private client: Client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] })

    private queue: Queue = new Queue()

    private connection: VoiceChannel | undefined
    private player: Player | undefined

    public async start() {
        await this.client.login(this.token)
    }
    public stop() {
        this.client.destroy()
        if (this.player) this.player.destroy()
    }

    // queue operation
    public async addNews(link: string) {
        console.log(`In bot ${this.client.user?.username} add new news`)

        await this.queue.addNews(link)
    }
    public async removeNews(id: number) {
        console.log(`In bot ${this.client.user?.username} remove news`)

        await this.queue.removeNews(id)
    }
    public async removeAllNews() {
        console.log(`In bot ${this.client.user?.username} remove all news`)

        await this.queue.removeAllNews()
    }
    public async getAllNews() {
        return this.queue.getAllNews()
    }

    public async addMusic(link: string) {
        console.log(`In bot ${this.client.user?.username} add new music`)

        await this.queue.addMusic(link)
    }
    public async removeMusic(id: number) {
        console.log(`In bot ${this.client.user?.username} remove music`)

        await this.queue.removeMusic(id)
    }
    public async removeAllMusic() {
        console.log(`In bot ${this.client.user?.username} remove all music`)

        await this.queue.removeAllMusic()
    }
    public async getAllMusic() {
        return this.queue.getAllMusic()
    }

    public async removeAll() {
        console.log(`In bot ${this.client.user?.username} add remove all queue`)

        this.queue.removeAll()
    }

    public async changeStremType(type: number) {
        console.log(`Changed stream type`)

        this.queue.changeStreamType(type)
    }

    // player
    private async startPlayer() {
        console.log(`In bot ${this.client.user?.username} start player`)

        if (!this.player) {
            if (!this.connection) return
            this.player = new Player(this.connection)

            this.player.on('stop', async () => {
                const next = this.queue.getNext()
                if (!next) {console.log(`In bot ${this.client.user?.username} queue is null`); return}

                await this.play(next.link, next.title)
            })
        }

        const next = this.queue.getNext()
        if (!next) {console.log(`In bot ${this.client.user?.username} queue is null`); return}

        await this.play(next.link, next.title)
    }
    private async play(link: string, title: string) {
        if (!this.player) return

        console.log(`Streming ${link} ${title}`)

        await this.player.play(link, {autoleave: false, quality: 'high', selfDeaf: false, selfMute: false, audiotype: 'arbitrary', volume: 1}).catch((error) => {console.log(error)})
    }

    public async stopPlayer() {
        if (!this.player) return

        await this.player.disconnect()
    }

    // connection
    public connect(guildID: string, channelID: string): boolean {
        console.log(`Bot try connect to g${guildID}:c${channelID}`)

        const guild: Guild | undefined  = this.client.guilds.cache.get(guildID)
        if (guild == undefined) {
            console.log(`Guild ${guildID} not found`)
            return false
        }

        const channel: Channel | undefined = guild.channels.cache.get(channelID)
        if (channel == undefined) {
            console.log(`Channel ${channelID} not found`)
            return false
        }

        if (!channel.isVoiceBased()) {
            console.log(`${channelID} not voice based`)
            return false
        }

        this.connection = channel as VoiceChannel

        this.startPlayer()

        return true
    }

    // util
    public async getToken() {
        return this.token
    }
    public async getName() {
        return this.client.user?.username
    }

    public constructor(token: string) {
        this.token = token
    }
}

export default Bot;