package utils

import "github.com/gin-gonic/gin"

func JSON(c *gin.Context, code int, obj any) {
	if gin.IsDebugging() {
		c.IndentedJSON(code, obj)
		return
	}
	c.JSON(code, obj)
}
