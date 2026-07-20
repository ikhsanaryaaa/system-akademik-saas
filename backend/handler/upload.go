package handler

import (
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ikhsanaryaaa/system-akademik-saas/backend/response"
)

// allowedImageExt memetakan ekstensi gambar ke MIME yang sesuai.
var allowedImageExt = map[string]string{
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".png":  "image/png",
	".webp": "image/webp",
}

const maxUploadBytes = 2 << 20 // 2MB

type UploadHandler struct {
	dir string
}

func NewUploadHandler(dir string) *UploadHandler {
	return &UploadHandler{dir: dir}
}

// Upload menerima satu file gambar (field "file"), memvalidasi tipe dan ukuran,
// menyimpannya dengan nama acak, lalu mengembalikan URL publiknya.
func (h *UploadHandler) Upload(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxUploadBytes+(1<<20))
	file, err := c.FormFile("file")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "File tidak ditemukan", nil)
		return
	}
	if file.Size > maxUploadBytes {
		response.Error(c, http.StatusBadRequest, "Ukuran file maksimal 2MB", nil)
		return
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	expectedMIME, allowed := allowedImageExt[ext]
	if !allowed {
		response.Error(c, http.StatusBadRequest, "Tipe file harus jpg, png, atau webp", nil)
		return
	}

	src, err := file.Open()
	if err != nil {
		response.Error(c, http.StatusBadRequest, "File tidak dapat dibaca", nil)
		return
	}
	defer src.Close()

	header := make([]byte, 512)
	n, err := io.ReadFull(src, header)
	if err != nil && err != io.ErrUnexpectedEOF {
		response.Error(c, http.StatusBadRequest, "File tidak dapat dibaca", nil)
		return
	}
	if http.DetectContentType(header[:n]) != expectedMIME {
		response.Error(c, http.StatusBadRequest, "Isi file tidak sesuai tipe gambar", nil)
		return
	}

	name := uuid.New().String() + ext
	dst := filepath.Join(h.dir, name)
	if err := c.SaveUploadedFile(file, dst); err != nil {
		response.Error(c, http.StatusInternalServerError, "Gagal menyimpan file", nil)
		return
	}
	response.OK(c, "File diunggah", gin.H{"url": fmt.Sprintf("/uploads/%s", name)})
}
