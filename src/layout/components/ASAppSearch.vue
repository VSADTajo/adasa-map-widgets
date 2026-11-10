<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/core/composables/useLocale'
import ASSearchInput from '@/forms/components/ASSearchInput.vue'
import type { SearchInputEmits, SearchInputProps } from '@/forms/types/SearchInputProps'

/**
 * Buscador de la barra corporativa (el autocompletado de la `TopBar` de los
 * visores SAIH): un `ASSearchInput` con forma de píldora, la etiqueta oculta
 * a la vista y el texto "Buscar" por defecto. Acepta todo lo de
 * `ASSearchInput`: sugerencias asíncronas, grupos, etiquetas (tipo de
 * estación, origen), acciones ("Centrar en el mapa") y avisos de no disponible.
 *
 * Va en el slot `search` de `ASAppShell`, que en móvil lo muestra tras un
 * botón de la barra.
 *
 * @example
 * ```vue
 * <ASAppShell :sections="secciones">
 *   <template #search>
 *     <ASAppSearch
 *       placeholder="Estación, municipio o código"
 *       :fetch-suggestions="buscar"
 *       @select="abrirFicha($event.data)"
 *       @suggestion-action="({ suggestion }) => centrarEn(suggestion.data)"
 *     />
 *   </template>
 * </ASAppShell>
 * ```
 */
const props = withDefaults(defineProps<SearchInputProps>(), {
  label: undefined,
  hint: undefined,
  error: undefined,
  size: 'md',
  id: undefined,
  theme: undefined,
  modelValue: '',
  debounce: 300,
  minChars: 2,
  placeholder: undefined,
  clearable: true,
  noResultsText: undefined,
  hideLabel: true,
})

const emit = defineEmits<SearchInputEmits>()
const { t } = useLocale()
const inputProps = computed(() => ({ ...props, label: props.label ?? t('layout.search') }))
</script>

<template>
  <ASSearchInput
    v-bind="inputProps"
    class="as-app-search"
    @update:model-value="emit('update:modelValue', $event)"
    @select="emit('select', $event)"
    @submit="emit('submit', $event)"
    @error="emit('error', $event)"
    @suggestion-action="emit('suggestion-action', $event)"
  />
</template>

<style scoped>
.as-app-search {
  width: 100%;
  max-width: 560px;
}

/* Píldora sobre el color corporativo, como en los visores SAIH. */
.as-app-search :deep(.as-control-box) {
  height: 40px;
  border-color: transparent;
  border-radius: var(--as-radius-full, 9999px);
}
</style>
