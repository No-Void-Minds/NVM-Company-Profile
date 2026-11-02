FROM golang:1.27-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/ ./cmd/...

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/server /usr/local/bin/server
COPY --from=build /out/compro-admin /usr/local/bin/compro-admin
ENV GIN_MODE=release
ENV HTTP_ADDR=0.0.0.0:8082
ENV MEDIA_DIR=/data/media
ENTRYPOINT ["/usr/local/bin/server"]
