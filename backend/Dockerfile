FROM golang:1.27.3-alpine AS build
RUN apk add --no-cache file
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Without nodynamic, gen2brain/webp pulls in purego, which links dynamically even with CGO off.
RUN CGO_ENABLED=0 go build -tags nodynamic -trimpath -ldflags="-s -w" -o /out/ ./cmd/...
# Distroless static has no loader, so a dynamic binary would only fail once the container starts.
RUN for bin in /out/server /out/compro-admin; do \
      file -b "$bin" | grep -q 'statically linked' || { echo "$bin harus statically linked:"; file "$bin"; exit 1; }; \
    done

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/server /usr/local/bin/server
COPY --from=build /out/compro-admin /usr/local/bin/compro-admin
ENV GIN_MODE=release
ENV HTTP_ADDR=0.0.0.0:8082
ENV MEDIA_DIR=/data/media
ENTRYPOINT ["/usr/local/bin/server"]
