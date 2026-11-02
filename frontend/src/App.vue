<script setup lang="ts">
import { useRoute } from 'vue-router'
import { routeHead, useHead } from '@/composables/useHead'

const route = useRoute()

useHead(() => routeHead(route))
</script>

<template>
  <RouterView />
</template>
