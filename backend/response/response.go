package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Body adalah format response JSON standar untuk seluruh endpoint.
type Body struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Errors  interface{} `json:"errors,omitempty"`
}

// OK mengirim response sukses dengan status 200.
func OK(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusOK, Body{Success: true, Message: message, Data: data})
}

// Created mengirim response sukses dengan status 201.
func Created(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusCreated, Body{Success: true, Message: message, Data: data})
}

// Error mengirim response gagal dengan status dan detail error tertentu.
func Error(c *gin.Context, status int, message string, errs interface{}) {
	c.JSON(status, Body{Success: false, Message: message, Errors: errs})
}
