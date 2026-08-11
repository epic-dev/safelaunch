FROM golang:alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGOOS=linux CGO_ENABLED=0 go build -o safelaunch main.go

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/safelaunch .

EXPOSE 8080

ENV ENV=production

CMD ["./safelaunch"]