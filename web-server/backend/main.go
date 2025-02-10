package main

import "log"

func main() {
	database, err := NewDatabase()
	if err != nil {
		log.Fatal(err)
	}
	defer database.Close()

	userService := NewUserService(database)

	server := NewApiServer(":8080", userService)
	server.Run()
}
