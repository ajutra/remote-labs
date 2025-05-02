package main

import (
	"golang.org/x/crypto/bcrypt"
)

// HashPassword toma una contraseña en texto plano y devuelve su hash bcrypt
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPasswordHash compara una contraseña en texto plano con su hash
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
