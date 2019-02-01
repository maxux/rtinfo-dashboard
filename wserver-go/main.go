//go:generate  go-bindata ../static/...
package main

import (
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"time"

	assetfs "github.com/elazarl/go-bindata-assetfs"
	"github.com/gorilla/websocket"

	_ "net/http/pprof"
)

type rtinfo struct {
	Rtinfo []struct {
		Hostname string `json:"hostname"`
		Lasttime int    `json:"lasttime"`
		Remoteip string `json:"remoteip"`
		Memory   struct {
			RAMTotal  int `json:"ram_total"`
			RAMUsed   int `json:"ram_used"`
			SwapTotal int `json:"swap_total"`
			SwapFree  int `json:"swap_free"`
		} `json:"memory"`
		CPUUsage []int     `json:"cpu_usage"`
		Loadavg  []float64 `json:"loadavg"`
		Battery  struct {
			ChargeFull int `json:"charge_full"`
			ChargeNow  int `json:"charge_now"`
			Load       int `json:"load"`
			Status     int `json:"status"`
		} `json:"battery"`
		Sensors struct {
			CPU struct {
				Average  int `json:"average"`
				Critical int `json:"critical"`
			} `json:"cpu"`
			Hdd struct {
				Average int `json:"average"`
				Peak    int `json:"peak"`
			} `json:"hdd"`
		} `json:"sensors"`
		Uptime  int `json:"uptime"`
		Time    int `json:"time"`
		Network []struct {
			Name   string `json:"name"`
			IP     string `json:"ip"`
			RxData int    `json:"rx_data"`
			TxData int    `json:"tx_data"`
			RxRate int    `json:"rx_rate"`
			TxRate int    `json:"tx_rate"`
			Speed  int    `json:"speed"`
		} `json:"network"`
		Disks []struct {
			Name         string `json:"name"`
			BytesRead    int64  `json:"bytes_read"`
			BytesWritten int64  `json:"bytes_written"`
			ReadSpeed    int    `json:"read_speed"`
			WriteSpeed   int    `json:"write_speed"`
			Iops         int    `json:"iops"`
		} `json:"disks"`
	} `json:"rtinfo"`
	Version    float64 `json:"version"`
	Servertime int     `json:"servertime"`
}

type dashboard struct {
	endpoint  string
	rtinfo    rtinfo
	wsclients map[string]*websocket.Conn
}

func newDashboard(endpoint string) *dashboard {
	return &dashboard{
		endpoint:  endpoint,
		wsclients: map[string]*websocket.Conn{},
	}
}

func (d *dashboard) Poll() {
	log.Println("Starting rtinfo fetching")

	for ; ; time.Sleep(time.Second) {
		resp, err := http.Get(d.endpoint)
		if err != nil {
			log.Printf("error fetching info from %s: %v", d.endpoint, err)
			continue
		}

		err = json.NewDecoder(resp.Body).Decode(&d.rtinfo)
		if err != nil {
			log.Printf("error reading response from %s: %v", d.endpoint, err)
			continue
		}
		resp.Body.Close()

		d.broadcast(d.rtinfo)

	}
}

func wspayload(conn *websocket.Conn, data rtinfo) error {
	content := struct {
		MessageType string `json:"type"`
		Payload     rtinfo `json:"payload"`
	}{
		"rtinfo",
		data,
	}
	log.Printf("[+] send rtinfo to %s\n", conn.RemoteAddr())
	return conn.WriteJSON(content)
}

func (d *dashboard) broadcast(data rtinfo) {
	if len(d.wsclients) <= 0 {
		return
	}

	for _, conn := range d.wsclients {
		if err := wspayload(conn, data); err != nil {
			log.Printf("error sending rtinfo to %s: %v", conn.RemoteAddr(), err)
			continue
		}
	}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func wshandler(dashboard *dashboard) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println(err)
			return
		}

		dashboard.wsclients[conn.RemoteAddr().String()] = conn
		log.Printf("[+] client connected %s\n", conn.RemoteAddr())

		for {
			if _, _, err := conn.NextReader(); err != nil {
				conn.Close()
				delete(dashboard.wsclients, conn.RemoteAddr().String())
				log.Printf("[+] client disconnected %s: %s\n", conn.RemoteAddr(), err)

				break
			}
		}
	}
}

var endpoint = flag.String("endpoint", "http://localhost:8089/json", "rtinfo daemon address")
var addr = flag.String("addr", ":8091", "http server address")

func main() {
	flag.Parse()
	dashboard := newDashboard(*endpoint)
	go dashboard.Poll()

	http.HandleFunc("/ws", wshandler(dashboard))
	http.Handle("/",
		http.FileServer(
			&assetfs.AssetFS{Asset: Asset, AssetDir: AssetDir, AssetInfo: AssetInfo, Prefix: "../static"}))
	if err := http.ListenAndServe(*addr, nil); err != nil {
		log.Println(err)
	}
}
