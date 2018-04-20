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
Import `wserver/rtinfows` and instanciate it:
```
import rtinfows

rtdashboard = rtinfows.RtInfoDashboard("http://my.endpoint.server.tld:8089/json")
rtdashboard.run()
```
