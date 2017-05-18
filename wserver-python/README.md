# rtinfo-dashboard
This is an embeded python webserver which fetch rtinfo json from a remote endpoint and forward it as websocket

# Preview
![rtinfo-dashboard-preview](https://clea.maxux.net/screenshots/16-05-17-230035.png)

# Requirement
- python 3.5+
- sanic
- websockets

# Basic setup
## Server
Include `wserver/rtinfo-wserver.py` and instanciate it:
```
rtdashboard = RtInfoDashboard("http://my.endpoint.server.tld:8089/json")
rtdashboard.run()
```

## Client
Edit `js/rtinfo-dashboard.js` and change `WebSocket("ws://localhost:8092/");` to your endpoint websocket.
