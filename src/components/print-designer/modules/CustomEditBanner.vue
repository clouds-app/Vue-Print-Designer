<script setup lang="ts">
import Save from "~icons/material-symbols/save";
import SaveAs from "~icons/material-symbols/save-as";
import Logout from "~icons/material-symbols/logout";

defineProps<{
  visible: boolean;
  title: string;
  saveText: string;
  saveAsText: string;
  exitText: string;
}>();

const emit = defineEmits<{
  (e: "save"): void;
  (e: "save-as"): void;
  (e: "exit"): void;
}>();
</script>

<template>
  <div
    v-if="visible"
    class="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100"
  >
    <div class="text-sm font-medium">{{ title }}</div>
    <div class="flex items-center gap-2">
      <button
        class="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 inline-flex items-center gap-1.5"
        @click="emit('save')"
      >
        <Save class="w-4 h-4" />
        {{ saveText }}
      </button>
      <button
        class="px-3 py-1.5 text-xs font-medium bg-blue-200 text-blue-900 rounded hover:bg-blue-300 dark:bg-blue-700 dark:hover:bg-blue-600 dark:text-white inline-flex items-center gap-1.5"
        @click="emit('save-as')"
      >
        <SaveAs class="w-4 h-4" />
        {{ saveAsText }}
      </button>
      <button
        class="px-3 py-1.5 text-xs font-medium bg-slate-200 text-slate-900 rounded hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100 inline-flex items-center gap-1.5"
        @click="emit('exit')"
      >
        <Logout class="w-4 h-4" />
        {{ exitText }}
      </button>
    </div>
  </div>
</template>
