import Server from "./src/server"

class App {
    public async main() {
        let server: Server = new Server("1234", 8080)

        server.start()
    }
}

new App().main()