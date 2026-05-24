<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
  inject,
} from "vue";
import { useI18n } from "vue-i18n";
import { useDesignerStore } from "@/stores/designer";
import { useFloatingTooltip } from "@/composables/useFloatingTooltip";
import type { Page } from "@/types";
import Close from "~icons/material-symbols/close";
import Help from "~icons/material-symbols/help";
import Undo2 from "~icons/material-symbols/undo";
import Redo2 from "~icons/material-symbols/redo";

const { t } = useI18n();
const store = useDesignerStore();
const modalContainer = inject("modal-container", ref<HTMLElement | null>(null));

const panelRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const isResizing = ref(false);
const startPos = ref({ x: 0, y: 0 });
const showHistoryHelpTooltip = ref(false);
const historyHelpButtonRef = ref<HTMLElement | null>(null);
const historyHelpTooltipRef = ref<HTMLElement | null>(null);
const HISTORY_PANEL_DEFAULT_WIDTH = 280;
const HISTORY_PANEL_DEFAULT_HEIGHT = 500;
const panelHeightMode = ref<"fit" | "fixed">("fit");
const resizeStart = ref({
  x: 0,
  y: 0,
  width: HISTORY_PANEL_DEFAULT_WIDTH,
  height: HISTORY_PANEL_DEFAULT_HEIGHT,
});
const panelPos = ref({ x: -9999, y: -9999 });
const panelSize = ref({
  width: HISTORY_PANEL_DEFAULT_WIDTH,
  height: HISTORY_PANEL_DEFAULT_HEIGHT,
});
const preferredPanelPos = ref({ x: -9999, y: -9999 });
const preferredPanelSize = ref({
  width: HISTORY_PANEL_DEFAULT_WIDTH,
  height: HISTORY_PANEL_DEFAULT_HEIGHT,
});
const activeTab = ref<"undo" | "redo">("undo");
const historyPanelHelp = computed(() => ({
  title: t("editor.historyHelp.title"),
  items: [
    t("editor.historyHelp.items.undo"),
    t("editor.historyHelp.items.redo"),
    t("editor.historyHelp.items.panel"),
  ],
}));
const {
  arrowStyle: historyHelpArrowStyle,
  placement: historyHelpPlacement,
  toggleTooltip: toggleHistoryHelpTooltip,
  tooltipStyle: historyHelpTooltipStyle,
} = useFloatingTooltip(
  showHistoryHelpTooltip,
  historyHelpButtonRef,
  historyHelpTooltipRef,
  { width: 288 },
);

const PANEL_MIN_WIDTH = 256;
const PANEL_MAX_WIDTH = 520;
const PANEL_MIN_HEIGHT = 280;
const PANEL_Z_ACTIVE_OFFSET = 1;

const props = withDefaults(
  defineProps<{
    baseZIndex?: number;
  }>(),
  {
    baseZIndex: 60,
  },
);

const designerInstanceId = inject<string | undefined>(
  "designer-instance-id",
  undefined,
);

const panelZIndex = computed(() =>
  isDragging.value || isResizing.value
    ? props.baseZIndex + PANEL_Z_ACTIVE_OFFSET
    : props.baseZIndex,
);

const emitBringToFront = () => {
  const detail: Record<string, unknown> = {
    panel: "history",
  };
  if (designerInstanceId) {
    detail.__designerInstanceId = designerInstanceId;
  }
  window.dispatchEvent(
    new CustomEvent("designer:panel-bring-to-front", { detail }),
  );
};

const handlePanelMouseDown = () => {
  emitBringToFront();
};

const closeHistoryPanel = () => {
  showHistoryHelpTooltip.value = false;
  store.setShowHistoryPanel(false);
};

const resetPanelSizeToDefault = () => {
  panelHeightMode.value = "fit";
  const defaults = {
    width: HISTORY_PANEL_DEFAULT_WIDTH,
    height: HISTORY_PANEL_DEFAULT_HEIGHT,
  };
  panelSize.value = { ...defaults };
  preferredPanelSize.value = { ...defaults };
  preferredPanelPos.value = { x: -9999, y: -9999 };
};

const getCanvasBounds = () => {
  const root =
    (panelRef.value?.getRootNode() as Document | ShadowRoot) || document;
  const canvasScroll = root.querySelector(
    ".canvas-scroll",
  ) as HTMLElement | null;
  if (!canvasScroll) return null;
  return canvasScroll.getBoundingClientRect();
};

const getPropertiesPanelRect = () => {
  const root =
    (panelRef.value?.getRootNode() as Document | ShadowRoot) || document;
  const panel = root.querySelector(
    '[data-floating-panel-key="properties"]',
  ) as HTMLElement | null;
  if (!panel) return null;

  const rect = panel.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const style = window.getComputedStyle(panel);
  if (style.display === "none" || style.visibility === "hidden") return null;

  return rect;
};

const clampPosition = (
  x: number,
  y: number,
  width: number,
  height: number,
  bounds: DOMRect,
) => {
  const minX = bounds.left;
  const minY = bounds.top;
  const maxX = Math.max(minX, bounds.right - width);
  const maxY = Math.max(minY, bounds.bottom - height);
  return {
    x: Math.max(minX, Math.min(x, maxX)),
    y: Math.max(minY, Math.min(y, maxY)),
  };
};

const handleDragStart = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.closest(".panel-close-btn")) return;
  if (target.closest(".panel-help-btn")) return;
  if (target.closest('[data-panel-resize-handle="true"]')) return;

  emitBringToFront();
  isDragging.value = true;
  startPos.value = {
    x: e.clientX - panelPos.value.x,
    y: e.clientY - panelPos.value.y,
  };
  document.addEventListener("mousemove", handleDragMove);
  document.addEventListener("mouseup", handleDragEnd);
};

const handleDragMove = (e: MouseEvent) => {
  if (!isDragging.value) return;

  let newX = e.clientX - startPos.value.x;
  let newY = e.clientY - startPos.value.y;
  const width = panelSize.value.width;
  const height = panelSize.value.height;
  const bounds = getCanvasBounds();

  if (bounds) {
    const clamped = clampPosition(newX, newY, width, height, bounds);
    newX = clamped.x;
    newY = clamped.y;
  } else {
    newX = Math.max(0, Math.min(newX, window.innerWidth - width));
    newY = Math.max(0, Math.min(newY, window.innerHeight - height));
  }

  panelPos.value = { x: newX, y: newY };
  preferredPanelPos.value = { x: newX, y: newY };
};

const handleDragEnd = () => {
  isDragging.value = false;
  document.removeEventListener("mousemove", handleDragMove);
  document.removeEventListener("mouseup", handleDragEnd);
};

const handleResizeStart = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  emitBringToFront();
  isResizing.value = true;
  resizeStart.value = {
    x: e.clientX,
    y: e.clientY,
    width: panelSize.value.width,
    height: panelSize.value.height,
  };
  document.addEventListener("mousemove", handleResizeMove);
  document.addEventListener("mouseup", handleResizeEnd);
};

const handleResizeMove = (e: MouseEvent) => {
  if (!isResizing.value) return;

  const deltaX = e.clientX - resizeStart.value.x;
  const deltaY = e.clientY - resizeStart.value.y;
  let nextWidth = resizeStart.value.width + deltaX;
  let nextHeight = resizeStart.value.height + deltaY;

  const bounds = getCanvasBounds();
  if (bounds) {
    const maxWidth = Math.max(
      PANEL_MIN_WIDTH,
      Math.min(PANEL_MAX_WIDTH, bounds.right - panelPos.value.x),
    );
    const maxHeight = Math.max(
      PANEL_MIN_HEIGHT,
      bounds.bottom - panelPos.value.y,
    );
    nextWidth = Math.max(PANEL_MIN_WIDTH, Math.min(nextWidth, maxWidth));
    nextHeight = Math.max(PANEL_MIN_HEIGHT, Math.min(nextHeight, maxHeight));
  } else {
    const maxWidth = Math.max(
      PANEL_MIN_WIDTH,
      Math.min(PANEL_MAX_WIDTH, window.innerWidth - panelPos.value.x),
    );
    const maxHeight = Math.max(
      PANEL_MIN_HEIGHT,
      window.innerHeight - panelPos.value.y,
    );
    nextWidth = Math.max(PANEL_MIN_WIDTH, Math.min(nextWidth, maxWidth));
    nextHeight = Math.max(PANEL_MIN_HEIGHT, Math.min(nextHeight, maxHeight));
  }

  panelSize.value = {
    width: nextWidth,
    height: nextHeight,
  };
  preferredPanelSize.value = {
    width: nextWidth,
    height: nextHeight,
  };
  panelHeightMode.value = "fixed";
};

const handleResizeEnd = () => {
  isResizing.value = false;
  document.removeEventListener("mousemove", handleResizeMove);
  document.removeEventListener("mouseup", handleResizeEnd);
};

const summarizeSnapshot = (pages: Page[]) => {
  const pageCount = Array.isArray(pages) ? pages.length : 0;
  const elementCount = (pages || []).reduce(
    (total, page) =>
      total + (Array.isArray(page?.elements) ? page.elements.length : 0),
    0,
  );
  return t("editor.historySnapshotInfo", {
    pages: pageCount,
    elements: elementCount,
  });
};

const resolveActionTitle = (actionKey?: string) => {
  if (!actionKey) return t("editor.historyAction.unknown");
  const translated = t(actionKey);
  return translated === actionKey
    ? t("editor.historyAction.unknown")
    : translated;
};

const pastRecords = computed(() => {
  const total = store.historyPast.length;
  return store.historyPast
    .map((pages, index) => ({
      id: `past-${index}`,
      title: resolveActionTitle(store.historyPastActionKeys[index]),
      stepLabel: t("editor.historyStep", { index: total - index }),
      summary: summarizeSnapshot(pages),
    }))
    .reverse();
});

const futureRecords = computed(() => {
  const total = store.historyFuture.length;
  return store.historyFuture
    .map((pages, index) => ({
      id: `future-${index}`,
      title: resolveActionTitle(store.historyFutureActionKeys[index]),
      stepLabel: t("editor.historyStep", { index: total - index }),
      summary: summarizeSnapshot(pages),
    }))
    .reverse();
});

const activeRecords = computed(() =>
  activeTab.value === "undo" ? pastRecords.value : futureRecords.value,
);

let retryCount = 0;
const updatePosition = async () => {
  await nextTick();
  const bounds = getCanvasBounds();

  if (bounds) {
    if (bounds.width === 0 && retryCount < 10) {
      retryCount++;
      setTimeout(updatePosition, 50);
      return;
    }

    retryCount = 0;

    const maxWidthByBounds = Math.max(
      PANEL_MIN_WIDTH,
      Math.min(PANEL_MAX_WIDTH, bounds.width),
    );
    const maxHeightByBounds = Math.max(PANEL_MIN_HEIGHT, bounds.height);
    const normalizedPreferredWidth = Math.min(
      Math.max(preferredPanelSize.value.width, PANEL_MIN_WIDTH),
      PANEL_MAX_WIDTH,
    );
    const normalizedPreferredHeight =
      panelHeightMode.value === "fit"
        ? maxHeightByBounds
        : Math.max(preferredPanelSize.value.height, PANEL_MIN_HEIGHT);

    preferredPanelSize.value = {
      width: normalizedPreferredWidth,
      height: normalizedPreferredHeight,
    };

    const nextWidth = Math.min(normalizedPreferredWidth, maxWidthByBounds);
    const nextHeight = Math.min(normalizedPreferredHeight, maxHeightByBounds);

    const hasPreferredPos =
      preferredPanelPos.value.x >= 0 && preferredPanelPos.value.y >= 0;
    let initialX = bounds.right - nextWidth - 16;
    const initialY = bounds.top;
    const propertiesRect = getPropertiesPanelRect();

    if (propertiesRect) {
      const intersectsDefaultPosition = !(
        propertiesRect.right <= initialX ||
        propertiesRect.left >= initialX + nextWidth ||
        propertiesRect.bottom <= initialY ||
        propertiesRect.top >= initialY + nextHeight
      );

      if (intersectsDefaultPosition) {
        const leftCandidate = propertiesRect.left - nextWidth - 12;
        if (leftCandidate >= bounds.left) {
          initialX = leftCandidate;
        } else {
          const rightCandidate = propertiesRect.right + 12;
          if (rightCandidate + nextWidth <= bounds.right) {
            initialX = rightCandidate;
          } else {
            initialX = bounds.left;
          }
        }
      }
    }

    const seedX = hasPreferredPos ? preferredPanelPos.value.x : initialX;
    const seedY = hasPreferredPos ? preferredPanelPos.value.y : initialY;
    const clampedPos = clampPosition(
      seedX,
      seedY,
      nextWidth,
      nextHeight,
      bounds,
    );

    panelSize.value = {
      width: nextWidth,
      height: nextHeight,
    };
    panelPos.value = clampedPos;

    if (!hasPreferredPos) {
      preferredPanelPos.value = { ...clampedPos };
    }
    return;
  }

  if (retryCount < 10) {
    retryCount++;
    setTimeout(updatePosition, 50);
  } else {
    if (preferredPanelPos.value.x < 0 || preferredPanelPos.value.y < 0) {
      preferredPanelPos.value = { x: 300, y: 12 };
    }

    preferredPanelSize.value = {
      width: Math.min(
        PANEL_MAX_WIDTH,
        Math.max(PANEL_MIN_WIDTH, preferredPanelSize.value.width),
      ),
      height:
        panelHeightMode.value === "fit"
          ? Math.max(PANEL_MIN_HEIGHT, window.innerHeight - 24)
          : Math.max(PANEL_MIN_HEIGHT, preferredPanelSize.value.height),
    };

    panelPos.value = { ...preferredPanelPos.value };
    panelSize.value = { ...preferredPanelSize.value };
  }
};

let resizeObserver: ResizeObserver | null = null;

watch(
  () => store.showHistoryPanel,
  (show) => {
    if (show) {
      activeTab.value = "undo";
      resetPanelSizeToDefault();
      updatePosition();
      emitBringToFront();

      nextTick(() => {
        if (!resizeObserver) {
          const root =
            (panelRef.value?.getRootNode() as Document | ShadowRoot) ||
            document;
          const canvasScroll = root.querySelector(".canvas-scroll");
          if (canvasScroll) {
            resizeObserver = new ResizeObserver(() => {
              if (store.showHistoryPanel) {
                updatePosition();
              }
            });
            resizeObserver.observe(canvasScroll);
          }
        }
      });
      return;
    }

    showHistoryHelpTooltip.value = false;

    handleDragEnd();
    handleResizeEnd();
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  },
);

onMounted(() => {
  if (!store.showHistoryPanel) return;

  resetPanelSizeToDefault();
  updatePosition();
  emitBringToFront();
  nextTick(() => {
    const root =
      (panelRef.value?.getRootNode() as Document | ShadowRoot) || document;
    const canvasScroll = root.querySelector(".canvas-scroll");
    if (canvasScroll) {
      resizeObserver = new ResizeObserver(() => {
        if (store.showHistoryPanel) {
          updatePosition();
        }
      });
      resizeObserver.observe(canvasScroll);
    }
  });
});

onUnmounted(() => {
  document.removeEventListener("mousemove", handleDragMove);
  document.removeEventListener("mouseup", handleDragEnd);
  document.removeEventListener("mousemove", handleResizeMove);
  document.removeEventListener("mouseup", handleResizeEnd);
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>

<template>
  <div
    v-if="store.showHistoryPanel"
    ref="panelRef"
    class="fixed bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
    @mousedown="handlePanelMouseDown"
    :style="{
      left: `${panelPos.x}px`,
      top: `${panelPos.y}px`,
      width: `${panelSize.width}px`,
      height: `${panelSize.height}px`,
      zIndex: panelZIndex,
    }"
  >
    <div
      class="relative p-4 pr-20 min-h-[72px] border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-move select-none"
      @mousedown="handleDragStart"
    >
      <div class="min-w-0">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {{ t("editor.historyPanel") }}
        </h2>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {{ t("editor.historyPanelSubtitle") }}
        </p>
      </div>
      <div class="absolute right-0 top-0 z-50 flex items-center gap-0">
        <button
          ref="historyHelpButtonRef"
          type="button"
          :class="[
            'panel-help-btn h-8 w-8 inline-flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200',
            showHistoryHelpTooltip
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
              : '',
          ]"
          :aria-label="t('editor.historyHelp.title')"
          :aria-pressed="showHistoryHelpTooltip"
          @mousedown.stop.prevent="toggleHistoryHelpTooltip"
        >
          <Help class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="panel-close-btn h-8 w-8 inline-flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200"
          @mousedown.stop
          @click.stop="closeHistoryPanel"
        >
          <Close class="w-4 h-4" />
        </button>
      </div>
    </div>

    <Teleport :to="modalContainer || 'body'">
      <div
        v-if="showHistoryHelpTooltip"
        ref="historyHelpTooltipRef"
        role="tooltip"
        class="pointer-events-auto select-text rounded border border-gray-200 bg-white text-left shadow-xl dark:border-gray-700 dark:bg-gray-900"
        :style="historyHelpTooltipStyle"
        @click.stop
      >
        <div
          v-if="historyHelpPlacement === 'bottom'"
          class="absolute -top-1.5 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
          :style="historyHelpArrowStyle"
        ></div>
        <div
          v-else
          class="absolute -bottom-1.5 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
          :style="historyHelpArrowStyle"
        ></div>
        <div
          class="overflow-y-auto p-3"
          :style="{ maxHeight: historyHelpTooltipStyle.maxHeight }"
        >
          <div class="flex items-start gap-2">
            <Help
              class="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300"
            />
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {{ historyPanelHelp.title }}
              </h3>
              <ul
                class="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-gray-600 dark:text-gray-300"
              >
                <li v-for="item in historyPanelHelp.items" :key="item">
                  {{ item }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <div class="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <button
        type="button"
        :class="[
          'flex-1 py-3 text-sm font-medium transition-colors relative',
          activeTab === 'undo'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800',
        ]"
        @click="activeTab = 'undo'"
      >
        {{ t("editor.historyUndoStack") }}
        <span class="ml-1 text-xs text-gray-400 dark:text-gray-500">
          {{ store.historyPast.length }}
        </span>
        <div
          v-if="activeTab === 'undo'"
          class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400"
        ></div>
      </button>
      <button
        type="button"
        :class="[
          'flex-1 py-3 text-sm font-medium transition-colors relative',
          activeTab === 'redo'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800',
        ]"
        @click="activeTab = 'redo'"
      >
        {{ t("editor.historyRedoStack") }}
        <span class="ml-1 text-xs text-gray-400 dark:text-gray-500">
          {{ store.historyFuture.length }}
        </span>
        <div
          v-if="activeTab === 'redo'"
          class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400"
        ></div>
      </button>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <div
        v-if="activeRecords.length === 0"
        class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center"
      >
        {{ t("editor.historyNoRecords") }}
      </div>

      <div v-else>
        <div
          v-for="item in activeRecords"
          :key="item.id"
          class="border-b border-gray-100 dark:border-gray-700 last:border-b-0 px-3 py-2"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
              {{ item.title }}
            </span>
            <span class="text-[11px] text-gray-500 dark:text-gray-400">
              {{ item.stepLabel }}
            </span>
          </div>
          <div class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {{ item.summary }}
          </div>
        </div>
      </div>
    </div>

    <div class="shrink-0 border-t border-gray-100 dark:border-gray-700 p-2">
      <div class="flex items-center gap-2">
        <button
          class="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="store.historyPast.length === 0"
          @click="store.undo()"
        >
          <Undo2 class="w-4 h-4" />
          {{ t("common.undo") }}
        </button>
        <button
          class="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="store.historyFuture.length === 0"
          @click="store.redo()"
        >
          <Redo2 class="w-4 h-4" />
          {{ t("common.redo") }}
        </button>
      </div>
    </div>

    <button
      type="button"
      title="Resize panel"
      data-panel-resize-handle="true"
      class="absolute bottom-0.5 right-0.5 z-20 h-4 w-4 cursor-se-resize bg-transparent p-0 text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
      @mousedown.stop.prevent="handleResizeStart"
    >
      <svg
        class="h-4 w-4"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.5 14L14 6.5"
          stroke="currentColor"
          stroke-width="1.4"
          stroke-linecap="round"
        />
        <path
          d="M3 14L14 3"
          stroke="currentColor"
          stroke-width="1.4"
          stroke-linecap="round"
        />
        <path
          d="M9.8 14L14 9.8"
          stroke="currentColor"
          stroke-width="1.4"
          stroke-linecap="round"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #d1d5db;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #374151;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #4b5563;
}
</style>
