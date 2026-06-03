
import { defineStore } from "pinia";
import { uuidv4 } from "@/utils/uuid";
import cloneDeep from "lodash/cloneDeep";
import {
  type DesignerState,
  type PrintElement,
  type TableColumn,
  type Page,
  type Guide,
  ElementType,
  type CustomElementTemplate,
  type WatermarkSettings,
  type CustomElementEditSnapshot,
  type BrandingSettings,
  type DesignerFontOption,
  type ListContextMenuConfig,
  type ListContextMenuItem,
  type TemplateModalFormConfig,
  type TemplateModalField,
} from "@/types";
import {
  getCrudConfig,
  buildEndpoint,
  buildFetchOptions,
} from "../../utils/crudConfig";
import { toast } from "../../utils/toast";
import {
  canCopyEntity,
  canDeleteEntity,
  canEditEntity,
  normalizeEntityConstraints,
  applyModalExtraValues,
  mergeExt,
} from "../../utils/entityConstraints";
import { useTemplateStore } from "../templates";
import { normalizeVariableKey } from "../../utils/variables";
import i18n from "../../locales";
import { defaultWatermark, defaultBranding, HISTORY_ACTION, hasOwn, inferElementUpdateHistoryAction, loadWatermark, loadDeveloperMode, loadPaginationDebugLogs, loadRenderDebugLogs, loadTextQuickToolbarEnabled, loadStatusBarVisible, getElementZIndex, getLayerSortedElements, buildLayerAssignments, canLayerMoveInPage, normalizeContextMenuConfig, normalizeTemplateModalFields, normalizeTemplateModalFormConfig, inferVariableFromContent, normalizeDesignerFontOptions, getEffectiveTableColumns, getNumericCellStyleHeight, getTableRowExplicitHeight, isHeaderFooterLineStyle, normalizeHeaderFooterLineStyle, normalizeHeaderFooterLineColor, normalizeHeaderFooterLineWidth, normalizeHeaderFooterLineSpanMode, normalizeHeaderFooterLineSpan, normalizeHeaderFooterLineRenderingEnabled, escapeAttributeSelectorValue, getCellBorderInsetRect, querySelectorAcrossDocumentAndShadowRoots } from './helpers';
import type { LayerMoveMode, HeaderFooterLineStyle, HeaderFooterLineSpanMode, EmbeddedCellBounds, EffectiveTableRows } from './helpers';

export const getters = {
    isTemplateEditable: (state: DesignerState) => {
      if (state.editingCustomElementId) return true;
      const templateStore = useTemplateStore();
      if (!templateStore.currentTemplateId) return true;
      const template = templateStore.templates.find(
        (t: any) => t.id === templateStore.currentTemplateId,
      );
      if (!template) return true;
      return canEditEntity(template);
    },
    selectedElement: (state: DesignerState) => {
      if (!state.selectedElementId) return null;
      for (const page of state.pages) {
        const el = page.elements.find((e: any) => e.id === state.selectedElementId);
        if (el) return el;
      }
      return null;
    },
    currentPage: (state: DesignerState) => state.pages[state.currentPageIndex],
    editingCustomElement: (state: DesignerState) => {
      if (!state.editingCustomElementId) return null;
      return (
        state.customElements.find(
          (el: any) => el.id === state.editingCustomElementId,
        ) || null
      );
    },
  };
