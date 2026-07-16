package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

// paginate membaca query page dan per_page, lalu mengembalikan
// page, perPage, dan offset dengan batas aman.
func paginate(c *gin.Context) (page, perPage, offset int) {
	page, _ = strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	perPage, _ = strconv.Atoi(c.DefaultQuery("per_page", "20"))
	if perPage < 1 {
		perPage = 20
	}
	if perPage > 100 {
		perPage = 100
	}
	offset = (page - 1) * perPage
	return page, perPage, offset
}
