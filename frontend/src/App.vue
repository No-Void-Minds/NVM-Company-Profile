<script setup lang="ts">
import { useRoute } from 'vue-router'
import { routeHead, useHead } from '@/composables/useHead'
import { useSystemCount } from '@/composables/useSystemCount'

const route = useRoute()
const systemCount = useSystemCount()

useHead(() => routeHead(route, systemCount.value))
</script>

<template>
  <RouterView />
</template>
