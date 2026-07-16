package password

import "golang.org/x/crypto/bcrypt"

// Hash menghasilkan bcrypt hash dari password plaintext.
func Hash(plain string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	return string(bytes), err
}

// Verify membandingkan password plaintext dengan hash tersimpan.
func Verify(hash, plain string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain)) == nil
}
