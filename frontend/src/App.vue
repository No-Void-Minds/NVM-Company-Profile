<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useHead } from '@/composables/useHead'

const route = useRoute()

useHead(() => ({
  title: route.meta.title ?? 'No Void Minds',
  description: route.meta.description ?? '',
}))
</script>

<template>
  <RouterView />
</template>
