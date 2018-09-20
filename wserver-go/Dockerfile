FROM golang as builder

WORKDIR /go/src/github.com/maxux/

# Build webserver
RUN git clone https://github.com/maxux/rtinfo-dashboard.git && go get -u github.com/jteeuwen/go-bindata/...
RUN cd rtinfo-dashboard/wserver-go && go get -d -u ./... && go generate && CGO_ENABLED=0 GOOS=linux go build -tags netgo -a -o $GOPATH/bin/dashboard

# Build final image
FROM alpine

COPY --from=builder /go/bin/dashboard /bin

EXPOSE 8091

CMD ["dashboard", "--addr", ":8091", "--endpoint", "http://127.0.0.1:8089/json"]
