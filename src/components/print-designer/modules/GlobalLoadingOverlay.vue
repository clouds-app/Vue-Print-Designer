<script setup lang="ts">
import Loading from "@/svg/components/LoadingIcon.vue";

defineProps<{
  visible: boolean;
}>();
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center z-[10000] pointer-events-auto transition-opacity duration-300"
  >
    <Loading class="animate-spin h-8 w-8 text-gray-500 dark:text-gray-300" />
  </div>
</template>
