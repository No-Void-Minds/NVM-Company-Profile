<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/api/client'
import IconSvg from '@/components/IconSvg.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import StateEmpty from '@/components/state/StateEmpty.vue'
import StateError from '@/components/state/StateError.vue'
import StateLoading from '@/components/state/StateLoading.vue'
import TechDetail from '@/components/TechDetail.vue'
import { NEED_KEYS, pad2, techName } from '@/composables/site'
import { useAsync } from '@/composables/useAsync'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useI18n } from '@/i18n'

const HASH_PREFIX = '#lab-'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const isDesktop = useMediaQuery('(min-width: 64rem)', true)
const { data, error, loading, run } = useAsync(() => api.techs())

const techs = computed(() => data.value ?? [])
const activeKey = ref<string | null>(null)
const need = ref<string | null>(null)

const matches = (needs: string[]) => need.value === null || needs.includes(need.value)
const matchCount = computed(() => techs.value.filter((t) => matches(t.needs)).length)
const activeIndex = computed(() => techs.value.findIndex((t) => t.key === activeKey.value))
const activeTech = computed(() => techs.value[activeIndex.value] ?? null)

// The panel on desktop always shows something, the accordion may be fully closed.
watch([techs, isDesktop], () => {
  if (isDesktop.value && !activeTech.value && techs.value.length > 0) {
    activeKey.value = techs.value[0].key
  }
})

// Runs on load and on later hash changes, so /teknologi#lab-formlock opens FORMLOCK (FR-23).
watch(
  [techs, () => route.hash],
  async () => {
    if (!route.hash.startsWith(HASH_PREFIX)) return
    const key = route.hash.slice(HASH_PREFIX.length)
    if (key === activeKey.value || !techs.value.some((t) => t.key === key)) return
    activeKey.value = key
    await nextTick()
    // On desktop the panel is what the link opened, the row may sit far below its top.
    const target = isDesktop.value
      ? document.querySelector('.tech-panel')
      : document.getElementById(`lab-${key}`)
    target?.scrollIntoView({ block: 'start' })
  },
  { immediate: true },
)

function preview(key: string) {
  if (isDesktop.value) activeKey.value = key
}

function choose(key: string) {
  if (!isDesktop.value && activeKey.value === key) {
    activeKey.value = null
    return
  }
  activeKey.value = key
  void router.replace({ hash: `${HASH_PREFIX}${key}` })
}
</script>

<template>
  <div class="wrap section">
    <SectionHeading level="h1" number="The Lab" title="Fabric first." :lead="t.tech.lead" />

    <StateLoading v-if="loading" :label="t.tech.loading" height="480px" class="mt-6" />
    <StateError v-else-if="error" :message="error" class="mt-6" @retry="run" />
    <StateEmpty v-else-if="techs.length === 0" :title="t.tech.empty" class="mt-6" />

    <template v-else>
      <div class="mt-6">
        <p id="need-filter-label" class="spec-label">{{ t.tech.filterLabel }}</p>
        <div
          role="group"
          aria-labelledby="need-filter-label"
          class="mt-1 flex flex-wrap items-center gap-1"
        >
          <button
            type="button"
            class="filter-button"
            :aria-pressed="need === null"
            @click="need = null"
          >
            {{ t.tech.all }}
          </button>
          <button
            v-for="key in NEED_KEYS"
            :key="key"
            type="button"
            class="filter-button"
            :aria-pressed="need === key"
            @click="need = key"
          >
            {{ t.needs[key] }}
          </button>
        </div>
        <p class="spec-label mt-2" aria-live="polite">{{ t.tech.matchCount(pad2(matchCount)) }}</p>
      </div>

      <div class="mt-4 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        <ol class="border-t border-line">
          <li
            v-for="(tech, index) in techs"
            :id="`lab-${tech.key}`"
            :key="tech.key"
            class="border-b border-line"
          >
            <button
              type="button"
              class="index-row"
              :class="{ 'index-row-dim': !matches(tech.needs) }"
              :aria-expanded="isDesktop ? undefined : activeKey === tech.key"
              :aria-current="isDesktop && activeKey === tech.key ? 'true' : undefined"
              :aria-controls="isDesktop ? undefined : `lab-panel-${tech.key}`"
              @mouseenter="preview(tech.key)"
              @focus="preview(tech.key)"
              @click="choose(tech.key)"
            >
              <span
                class="index-number"
                :class="{ 'text-signal': activeKey === tech.key && matches(tech.needs) }"
              >
                {{ pad2(index + 1) }}
              </span>
              <span class="flex-1 text-h3">{{ techName(tech.name) }}</span>
              <IconSvg
                v-if="!isDesktop"
                name="chevron-down"
                :class="{ 'rotate-180': activeKey === tech.key }"
              />
            </button>
            <div
              v-if="!isDesktop && activeKey === tech.key"
              :id="`lab-panel-${tech.key}`"
              class="pt-1 pb-4"
            >
              <TechDetail :tech="tech" :number="index + 1" />
            </div>
          </li>
        </ol>

        <aside
          v-if="isDesktop && activeTech"
          class="tech-panel"
          aria-live="polite"
          :aria-label="t.tech.panel"
          tabindex="0"
        >
          <Transition name="index-sync" mode="out-in">
            <TechDetail :key="activeTech.key" :tech="activeTech" :number="activeIndex + 1" />
          </Transition>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.filter-button {
  min-height: 44px;
  padding: 8px 16px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-control);
  cursor: pointer;
}

.filter-button:active {
  background: var(--raised);
}

.filter-button[aria-pressed='true'] {
  background: var(--fg);
  color: var(--bg);
}

.index-row {
  display: flex;
  width: 100%;
  min-height: 56px;
  align-items: center;
  gap: 16px;
  padding-block: 8px;
  text-align: left;
  cursor: pointer;
  transition: color 160ms ease;
}

.index-row:active {
  background: var(--raised);
}

.index-row-dim {
  color: var(--line-strong);
}

.index-number {
  font-family: var(--font-mono);
  font-size: var(--text-label);
  letter-spacing: 0.12em;
}

.tech-panel {
  position: sticky;
  top: 96px;
  align-self: start;
  /* Taller than the screen it could not stay in view, and FR-20 wants it to */
  max-height: calc(100svh - 112px);
  overflow-y: auto;
  border: 1px solid var(--line);
  background: var(--surface);
  padding: 32px;
}

.index-sync-enter-active,
.index-sync-leave-active {
  transition: opacity 120ms ease;
}

.index-sync-enter-from,
.index-sync-leave-to {
  opacity: 0;
}

@media (hover: hover) {
  .filter-button:hover:not([aria-pressed='true']) {
    background: var(--raised);
  }

  .index-row:hover {
    background: var(--raised);
  }
}
</style>
