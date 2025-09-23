import { deviceType } from '@/utilities/helpers/user-agent-helpers';
import { LayoutOptions } from '@jumbo/types';
import {
  SIDEBAR_ANCHOR_POSITIONS,
  SIDEBAR_SCROLL_TYPES,
  SIDEBAR_STYLES,
  SIDEBAR_VARIANTS,
  SIDEBAR_VIEWS,
} from '@jumbo/utilities/constants';

const isMobile = deviceType() === "mobile";

const defaultLayoutConfig: LayoutOptions = {
  sidebar: {
    open: !isMobile,
    hide: false,
    variant: SIDEBAR_VARIANTS.PERSISTENT,
    style: SIDEBAR_STYLES.FULL_HEIGHT,
    view: SIDEBAR_VIEWS.FULL,
    scrollType: SIDEBAR_SCROLL_TYPES.FIXED,
    anchor: SIDEBAR_ANCHOR_POSITIONS.LEFT,
    width: 240,
    minWidth: 80,
    drawer: true,
    drawerBreakpoint: 'lg',
  },
  header: {
    hide: false,
    fixed: true,
    sx: {
      height: 80,
    },
    drawerBreakpoint: 'lg',
  },
  footer: {
    hide: false,
  },
  root: {},
  content: {
    sx: {
      py: 4,
    },
  },
  wrapper: {},
  main: {},
};

export const CONTAINER_MAX_WIDTH = 1320;

export { defaultLayoutConfig };
