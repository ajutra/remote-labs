package main

import "log"

func main() {
	database, err := NewDatabase()
	if err != nil {
		log.Fatal(err)
	}

	defer database.Close()

	server := NewApiServer(":8080")
	server.Run()
}
