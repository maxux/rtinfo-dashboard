import asyncio
import websockets
import requests
import json
from sanic import Sanic
from sanic import response

class RtInfoDashboard():
    def __init__(self, endpoint):
        self.endpoint = endpoint

        self.wsclients = set()
        self.rtinfo = {}

        self.app = Sanic(__name__)
        self.app.static("/", "../")

    #
    # Websocket
    #
    async def wsbroadcast(self, type, payload):
        if not len(self.wsclients):
            return

        content = json.dumps({"type": type, "payload": payload})

        for client in self.wsclients:
            if not client.open:
                continue

            await client.send(content)

    async def wspayload(self, websocket, type, payload):
        content = json.dumps({"type": type, "payload": payload})
        await websocket.send(content)

    async def handler(self, websocket, path):
        self.wsclients.add(websocket)

        print("[+] client connected")

        try:
            # pushing current data
            await self.wspayload(websocket, "rtinfo", self.rtinfo)

            while True:
                if not websocket.open:
                    break

                await asyncio.sleep(1)

        finally:
            print("[+] client disconnected")
            self.wsclients.remove(websocket)

    #
    # rtinfo
    #
    async def rtinfo_handler(self):
        print("Starting rtinfo fetching")

        while True:
            r = requests.get(self.endpoint)
            self.rtinfo = r.json()

            # notify connected client
            await self.wsbroadcast("rtinfo", self.rtinfo)
            await asyncio.sleep(1)

    #
    # httpd
    #
    def httpd_routes(self, app):
        @app.route("/")
        async def httpd_routes_index(request):
            return response.redirect('/index.html')

    def run(self):
        #
        # standard polling handlers
        #
        loop = asyncio.get_event_loop()
        asyncio.ensure_future(self.rtinfo_handler())

        #
        # http receiver
        # will receive message from restful request
        # this will updates sensors status
        #
        self.httpd_routes(self.app)
        httpd = self.app.create_server(host="0.0.0.0", port=8091)
        asyncio.ensure_future(httpd, loop=loop)

        #
        # handle websocket communication
        #
        websocketd = websockets.serve(self.handler, '0.0.0.0', 8092)
        asyncio.ensure_future(websocketd, loop=loop)

        #
        # main loop, let's run everything together
        #
        loop.run_forever()

