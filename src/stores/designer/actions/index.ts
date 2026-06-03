
import { coreActions } from './core';
import { elementActions } from './element';
import { pageActions } from './page';
import { tableActions } from './table';
import { historyActions } from './history';
import { guideActions } from './guide';
import { selectionActions } from './selection';
import { layerActions } from './layer';

export const actions = {
  ...coreActions,
  ...elementActions,
  ...pageActions,
  ...tableActions,
  ...historyActions,
  ...guideActions,
  ...selectionActions,
  ...layerActions
};
