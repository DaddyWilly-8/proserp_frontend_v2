// icons.tsx
import React from 'react';
import {
  DashboardCustomizeOutlined,
  RocketLaunchOutlined,
  FormatListNumberedOutlined,
  ChecklistRtlOutlined,
  PointOfSaleOutlined,
  RequestQuoteOutlined,
  AssessmentOutlined,
  CorporateFareOutlined,
  ShareOutlined,
  CurrencyExchangeOutlined,
  HandshakeOutlined,
  StraightenOutlined,
  ReceiptOutlined,
  ShoppingCartOutlined,
  ManageAccountsOutlined,
  VerifiedOutlined,
  ShoppingCartCheckout,
  ViewAgendaOutlined,
  QrCode,
  Inventory2Outlined,
  TuneOutlined,
  StoreOutlined,
  SmsOutlined,
  TroubleshootOutlined,
  CardMembershipOutlined,
  RoomPreferencesOutlined,
  EditAttributesOutlined,
  AccountTreeOutlined,
  LocalGasStation,
} from '@mui/icons-material';

import { Box } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolderOpen,
  faUsersGear,
  faFillDrip,
  faRulerVertical,
} from '@fortawesome/free-solid-svg-icons';

import type { SvgIconProps } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

type MuiIconComponent = React.ComponentType<SvgIconProps>;

type NormalizedIcon =
  | {
      name: string;
      type: 'mui';
      Component: MuiIconComponent;
      sx: SxProps<Theme>;
    }
  | {
      name: string;
      type: 'fa';
      icon: any;
      sx: SxProps<Theme>;
    };

const defaultIconSize = 20;
const defaultSx: SxProps<Theme> = { fontSize: defaultIconSize };

const rawIcons = [
  { name: 'quickLaunch', type: 'mui' as const, Component: RocketLaunchOutlined },
  { name: 'dashboard', type: 'mui' as const, Component: DashboardCustomizeOutlined },
  { name: 'requisitions', type: 'mui' as const, Component: FormatListNumberedOutlined },
  { name: 'approvals', type: 'mui' as const, Component: ChecklistRtlOutlined },
  { name: 'approvedPayments', type: 'mui' as const, Component: VerifiedOutlined },
  { name: 'approvedPurchases', type: 'mui' as const, Component: ShoppingCartCheckout },
  { name: 'counter', type: 'mui' as const, Component: PointOfSaleOutlined },
  { name: 'proforma', type: 'mui' as const, Component: RequestQuoteOutlined },
  { name: 'projects', type: 'mui' as const, Component: ViewAgendaOutlined },
  { name: 'transactions', type: 'mui' as const, Component: ReceiptOutlined },
  { name: 'purchases', type: 'mui' as const, Component: ShoppingCartOutlined },
  { name: 'consumptions', type: 'fa' as const, icon: faFillDrip },
  { name: 'barcharts', type: 'mui' as const, Component: AssessmentOutlined },
  { name: 'organizations', type: 'mui' as const, Component: CorporateFareOutlined },
  { name: 'batches', type: 'mui' as const, Component: QrCode },
  { name: 'invitations', type: 'mui' as const, Component: ShareOutlined },
  { name: 'stakeholders', type: 'mui' as const, Component: HandshakeOutlined },
  { name: 'currencies', type: 'mui' as const, Component: CurrencyExchangeOutlined },
  { name: 'measurement_units', type: 'mui' as const, Component: StraightenOutlined },
  { name: 'filesShelf', type: 'fa' as const, icon: faFolderOpen },
  { name: 'usersManagement', type: 'mui' as const, Component: ManageAccountsOutlined },
  { name: 'reports', type: 'mui' as const, Component: AssessmentOutlined },
  { name: 'product_categories', type: 'mui' as const, Component: Inventory2Outlined },
  { name: 'products', type: 'mui' as const, Component: Inventory2Outlined },
  { name: 'manufacturingMasters', type: 'mui' as const, Component: TuneOutlined },
  { name: 'outlets', type: 'mui' as const, Component: StoreOutlined },
  { name: 'settings', type: 'mui' as const, Component: StoreOutlined },
  { name: 'nextSMS', type: 'mui' as const, Component: SmsOutlined },
  { name: 'troubleshooting', type: 'mui' as const, Component: TroubleshootOutlined },
  { name: 'subscriptions', type: 'mui' as const, Component: CardMembershipOutlined },
  { name: 'salesShifts', type: 'mui' as const, Component: LocalGasStation },
  { name: 'dippings', type: 'fa' as const, icon: faRulerVertical },
  { name: 'fuelMasters', type: 'mui' as const, Component: RoomPreferencesOutlined },
  { name: 'prosAfricans', type: 'fa' as const, icon: faUsersGear },
  { name: 'editAttributes', type: 'mui' as const, Component: EditAttributesOutlined },
  { name: 'accountTree', type: 'mui' as const, Component: AccountTreeOutlined },
] as const;

export const APP_ICONS: NormalizedIcon[] = rawIcons.map((icon) => ({
  ...icon,
  sx: ('sx' in icon && icon.sx) ? icon.sx : defaultSx,
}));

const MuiIcon = ({ Component, sx }: { Component: MuiIconComponent; sx: SxProps<Theme> }) => (
  <Component sx={sx} />
);

const FaIcon = ({ icon }: { icon: any }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', width: defaultIconSize, height: defaultIconSize }}>
    <FontAwesomeIcon
      icon={icon}
      style={{
        width: defaultIconSize - 2,
        height: defaultIconSize - 2,
        position: 'relative',
        top: 1,
      }}
    />
  </Box>
);

export const iconMap = Object.fromEntries(
  APP_ICONS.map(({ name, type, ...rest }) => {
    if (type === 'mui') {
      const { Component, sx } = rest as { Component: MuiIconComponent; sx: SxProps<Theme> };
      return [name, <MuiIcon key={name} Component={Component} sx={sx} />];
    } else {
      const { icon } = rest as { icon: any };
      return [name, <FaIcon key={name} icon={icon} />];
    }
  })
) as Record<string, React.ReactNode>;