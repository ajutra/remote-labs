package main

func main() {
	service := NewService()

	server := NewApiServer("localhost:8080", service)
	server.Run()
}
