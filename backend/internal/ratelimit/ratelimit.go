// Package ratelimit is an in-memory token bucket keyed by string.
// Counters reset on restart, which is acceptable for a single backend instance.
package ratelimit

import (
	"sync"
	"time"
)

type bucket struct {
	tokens float64
	seen   time.Time
}

type Limiter struct {
	mu        sync.Mutex
	buckets   map[string]*bucket
	capacity  float64
	window    time.Duration
	lastPrune time.Time
	now       func() time.Time
}

// New allows capacity events per window, refilled gradually.
func New(capacity int, window time.Duration) *Limiter {
	return &Limiter{
		buckets:   make(map[string]*bucket),
		capacity:  float64(capacity),
		window:    window,
		lastPrune: time.Now(),
		now:       time.Now,
	}
}

func (l *Limiter) Allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := l.now()
	l.prune(now)

	b, ok := l.buckets[key]
	if !ok {
		b = &bucket{tokens: l.capacity, seen: now}
		l.buckets[key] = b
	}
	b.tokens += now.Sub(b.seen).Seconds() * l.capacity / l.window.Seconds()
	if b.tokens > l.capacity {
		b.tokens = l.capacity
	}
	b.seen = now

	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}

// A bucket idle for a whole window is full again, so dropping it changes nothing.
func (l *Limiter) prune(now time.Time) {
	if now.Sub(l.lastPrune) < l.window {
		return
	}
	for key, b := range l.buckets {
		if now.Sub(b.seen) >= l.window {
			delete(l.buckets, key)
		}
	}
	l.lastPrune = now
}
