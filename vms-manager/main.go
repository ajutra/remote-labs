package main

func main() {
	vmManager := NewVmManager()
	service := NewService(vmManager)

	server := NewApiServer("localhost:8080", service)
	server.Run()
}
