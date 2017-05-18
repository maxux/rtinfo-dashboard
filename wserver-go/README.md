# rtindo-dashboard
This project is a fork from https://github.com/maxux/rtinfo-dashboard.  
It replace the python server with a go server and embeds the web pages of the dashboard in the binary.
The goal is to make the dashboard really easy to deploy and self-contained

## How to build
```shell
git clone https://github.com/zaibon/rtinfo-dashboard.git
cd rtinfo-dashboard/wserver-go
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
