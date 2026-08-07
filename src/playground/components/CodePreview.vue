<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ code: string }>()

const copied = ref(false)

async function copyCode(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <div class="pg-code-preview">
    <div class="pg-code-preview__toolbar">
      <span>Código</span>
      <button type="button" class="pg-code-preview__copy" @click="copyCode">
        {{ copied ? 'Copiado ✓' : 'Copiar' }}
      </button>
    </div>
    <pre class="pg-code-preview__pre"><code>{{ props.code }}</code></pre>
  </div>
</template>

<style scoped>
.pg-code-preview {
  border: 1px solid var(--pg-border);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--pg-code-bg);
}

.pg-code-preview__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  font-size: 0.72rem;
  color: var(--pg-text-muted);
  border-bottom: 1px solid var(--pg-border);
}

.pg-code-preview__copy {
  border: 1px solid var(--pg-border);
  background: none;
  color: inherit;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 0.72rem;
  cursor: pointer;
}

.pg-code-preview__copy:hover {
  background-color: var(--pg-surface-muted);
}

.pg-code-preview__pre {
  margin: 0;
  padding: 12px;
  overflow-x: auto;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--pg-code-text);
}
</style>
