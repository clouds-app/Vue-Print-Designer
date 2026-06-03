<script setup lang="ts">
import type { CSSProperties } from "vue";
import PanelResizeIcon from "@/svg/components/PanelResizeIcon.vue";

withDefaults(
  defineProps<{
    visible: boolean;
    panelStyle: CSSProperties;
    zIndex: number;
    resizeTitle: string;
    panelKey?: string;
    contentClass?: string;
    resizeButtonClass?: string;
  }>(),
  {
    panelKey: undefined,
    contentClass:
      "relative h-full w-full pointer-events-auto rounded-t-lg overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
    resizeButtonClass:
      "absolute bottom-0.5 right-0.5 z-20 h-4 w-4 cursor-se-resize bg-transparent p-0 text-gray-400 pointer-events-auto hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400",
  },
);

const emit = defineEmits<{
  (e: "panel-mousedown", event: MouseEvent): void;
  (e: "resize-mousedown", event: MouseEvent): void;
}>();
</script>

<template>
  <div
    v-show="visible"
    data-floating-panel-surface="true"
    :data-floating-panel-key="panelKey"
    class="absolute pointer-events-none"
    :style="[panelStyle, { zIndex }]"
  >
    <div :class="contentClass" @mousedown="emit('panel-mousedown', $event)">
      <slot />
    </div>
    <button
      type="button"
      :title="resizeTitle"
      :class="resizeButtonClass"
      @mousedown.stop.prevent="emit('resize-mousedown', $event)"
    >
      <PanelResizeIcon class="h-4 w-4" />
    </button>
  </div>
</template>
