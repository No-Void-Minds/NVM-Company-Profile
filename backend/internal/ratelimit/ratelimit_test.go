package ratelimit

import (
	"testing"
	"time"
)

func newAt(capacity int, window time.Duration) (*Limiter, *time.Time) {
	clock := time.Date(2026, 11, 2, 9, 0, 0, 0, time.UTC)
	l := New(capacity, window)
	l.lastPrune = clock
	l.now = func() time.Time { return clock }
	return l, &clock
}

// AC-07: the sixth submission within an hour is refused.
func TestSixthRequestInWindowIsRefused(t *testing.T) {
	l, _ := newAt(5, time.Hour)
	for i := range 5 {
		if !l.Allow("ip") {
			t.Fatalf("kiriman ke-%d seharusnya lolos", i+1)
		}
	}
	if l.Allow("ip") {
		t.Fatal("kiriman keenam seharusnya ditolak")
	}
}

func TestKeysAreIndependent(t *testing.T) {
	l, _ := newAt(1, time.Hour)
	if !l.Allow("a") || !l.Allow("b") {
		t.Fatal("kunci berbeda tidak boleh berbagi kuota")
	}
	if l.Allow("a") {
		t.Fatal("kuota a sudah habis")
	}
}

func TestRefillsGradually(t *testing.T) {
	l, clock := newAt(5, time.Hour)
	for range 5 {
		l.Allow("ip")
	}
	*clock = clock.Add(11 * time.Minute)
	if l.Allow("ip") {
		t.Fatal("belum 12 menit, token belum kembali")
	}
	*clock = clock.Add(2 * time.Minute)
	if !l.Allow("ip") {
		t.Fatal("setelah 12 menit satu token seharusnya kembali")
	}
	if l.Allow("ip") {
		t.Fatal("hanya satu token yang kembali")
	}
}

func TestPruneDropsIdleBuckets(t *testing.T) {
	l, clock := newAt(5, time.Hour)
	l.Allow("lama")
	*clock = clock.Add(2 * time.Hour)
	l.Allow("baru")
	if _, ok := l.buckets["lama"]; ok {
		t.Fatal("bucket lama seharusnya dibuang")
	}
}
