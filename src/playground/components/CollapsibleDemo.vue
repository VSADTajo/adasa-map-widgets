<script setup lang="ts">
import ASCollapsible from '@/forms/components/ASCollapsible.vue'
import ASButton from '@/forms/components/ASButton.vue'
import type { CollapsibleProps } from '@/forms/types/CollapsibleProps'

/**
 * Demo de `ASCollapsible`: la sección editable con contenido y una acción
 * en la cabecera, y debajo otra plana, para ver cómo se apilan en un panel.
 */
const props = withDefaults(defineProps<CollapsibleProps>(), {
  open: undefined,
  defaultOpen: true,
  badge: undefined,
  headingLevel: 3,
  flat: false,
  id: undefined,
  theme: undefined,
})
const emit = defineEmits<{ 'update:open': [open: boolean]; action: [] }>()
</script>

<template>
  <div class="collapsible-demo">
    <ASCollapsible v-bind="props" @update:open="emit('update:open', $event)">
      <template #actions>
        <ASButton variant="ghost" size="sm" :theme="props.theme" @click="emit('action')">
          Ver todo
        </ASButton>
      </template>
      <ul class="collapsible-demo__list">
        <li>Aranjuez · 12,4 m³/s</li>
        <li>Toledo · 18,9 m³/s</li>
        <li>Talavera de la Reina · 25,1 m³/s</li>
      </ul>
    </ASCollapsible>
    <ASCollapsible
      title="Otra sección (flat, empieza cerrada)"
      flat
      :default-open="false"
      :theme="props.theme"
    >
      <p class="collapsible-demo__text">Contenido de la segunda sección.</p>
    </ASCollapsible>
  </div>
</template>

<style scoped>
.collapsible-demo {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 360px;
}

.collapsible-demo__list {
  margin: 0;
  padding: 0 4px;
  list-style: none;
  line-height: 2;
}

.collapsible-demo__text {
  margin: 0;
}
</style>
