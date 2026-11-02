<template>
  <span class="brand-logo" aria-hidden="true"></span>
</template>

<style scoped>
/* nvm-logo.png is pure white on transparency. Used as a mask, its exact shape is
   filled with --fg, so the logo stays correct in both themes without a recolored copy. */
.brand-logo {
  display: block;
  height: 40px;
  aspect-ratio: 4084 / 1512;
  background-color: var(--fg);
  -webkit-mask: url('/brand/nvm-logo.png') center / contain no-repeat;
  mask: url('/brand/nvm-logo.png') center / contain no-repeat;
}

@media (forced-colors: active) {
  .brand-logo {
    forced-color-adjust: none;
    background-color: CanvasText;
  }
}
</style>
