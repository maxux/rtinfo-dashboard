# rtindo-dashboard (go)
This a go-lang webserver/websocket-server which embeds the web pages of the dashboard in the binary.
The goal is to make the dashboard really easy to deploy and self-contained.

## How to build
```shell
go get -u github.com/jteeuwen/go-bindata/...
git clone https://github.com/zaibon/rtinfo-dashboard.git
cd rtinfo-dashboard/wserver-go
go get -d -u ./...
go generate
go build
```

## Start dashboard
`./wserver-go -endpoint http://zaibon.be:8089/json -addr :8080`

### Usage:
```
Usage of ./wserver-go:
  -addr string
    	http server address (default ":8091")
  -endpoint string
    	rtinfo daemon address (default ":8089")
```
