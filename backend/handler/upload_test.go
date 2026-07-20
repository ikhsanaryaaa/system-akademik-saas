package handler

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestUploadValidatesContentAndSavesImage(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("valid png", func(t *testing.T) {
		dir := t.TempDir()
		body, contentType := multipartBody(t, "photo.png", pngBytes(t))
		recorder := performUpload(t, dir, body, contentType)

		if recorder.Code != http.StatusOK {
			t.Fatalf("status = %d, body = %s", recorder.Code, recorder.Body.String())
		}
		entries, err := os.ReadDir(dir)
		if err != nil || len(entries) != 1 || filepath.Ext(entries[0].Name()) != ".png" {
			t.Fatalf("file tersimpan tidak sesuai: entries=%v err=%v", entries, err)
		}
	})

	t.Run("fake png", func(t *testing.T) {
		dir := t.TempDir()
		body, contentType := multipartBody(t, "photo.png", []byte("bukan gambar"))
		recorder := performUpload(t, dir, body, contentType)

		if recorder.Code != http.StatusBadRequest || !strings.Contains(recorder.Body.String(), "Isi file tidak sesuai tipe gambar") {
			t.Fatalf("status = %d, body = %s", recorder.Code, recorder.Body.String())
		}
	})
}

func multipartBody(t *testing.T, name string, content []byte) (*bytes.Buffer, string) {
	t.Helper()
	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", name)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := part.Write(content); err != nil {
		t.Fatal(err)
	}
	if err := writer.Close(); err != nil {
		t.Fatal(err)
	}
	return body, writer.FormDataContentType()
}

func performUpload(t *testing.T, dir string, body *bytes.Buffer, contentType string) *httptest.ResponseRecorder {
	t.Helper()
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/uploads", body)
	ctx.Request.Header.Set("Content-Type", contentType)
	NewUploadHandler(dir).Upload(ctx)
	return recorder
}

func pngBytes(t *testing.T) []byte {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, 1, 1))
	img.Set(0, 0, color.White)
	var data bytes.Buffer
	if err := png.Encode(&data, img); err != nil {
		t.Fatal(err)
	}
	return data.Bytes()
}
