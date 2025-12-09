// src/components/icons.tsx   (or wherever you store it)
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

import { Box, SvgIconProps } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolderOpen,
  faUsersGear,
  faFillDrip,
  faRulerVertical,
} from '@fortawesome/free-solid-svg-icons';

const ICON_SIZE = 20;

// ---------------------------------------------------------------------
// 1. Every icon now has a real React component (what Jumbo expects)
// ---------------------------------------------------------------------
type IconDef = {
  name: string;
  Component: React.ComponentType<SvgIconProps>;
};

// Helper that turns a FontAwesome icon into an MUI-compatible component
const FaWrapper = ({ icon }: { icon: any }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: ICON_SIZE,
      height: ICON_SIZE,
    }}
  >
    <FontAwesomeIcon
      icon={icon}
      style={{ width: ICON_SIZE - 2, height: ICON_SIZE - 2 }}
    />
  </Box>
);

// ---------------------------------------------------------------------
// 2. Central list – add a new icon here and it instantly works everywhere
// ---------------------------------------------------------------------
const rawIcons: IconDef[] = [
  { name: 'quickLaunch', Component: RocketLaunchOutlined },
  { name: 'dashboard', Component: DashboardCustomizeOutlined },
  { name: 'requisitions', Component: FormatListNumberedOutlined },
  { name: 'approvals', Component: ChecklistRtlOutlined },
  { name: 'approvedPayments', Component: VerifiedOutlined },
  { name: 'approvedPurchases', Component: ShoppingCartCheckout },
  { name: 'counter', Component: PointOfSaleOutlined },
  { name: 'proforma', Component: RequestQuoteOutlined },
  { name: 'projects', Component: ViewAgendaOutlined },
  { name: 'transactions', Component: ReceiptOutlined },
  { name: 'purchases', Component: ShoppingCartOutlined },
  { name: 'barcharts', Component: AssessmentOutlined },
  { name: 'organizations', Component: CorporateFareOutlined },
  { name: 'batches', Component: QrCode },
  { name: 'invitations', Component: ShareOutlined },
  { name: 'stakeholders', Component: HandshakeOutlined },
  { name: 'currencies', Component: CurrencyExchangeOutlined },
  { name: 'measurement_units', Component: StraightenOutlined },
  { name: 'usersManagement', Component: ManageAccountsOutlined },

  // FontAwesome icons (wrapped)
  { name: 'consumptions', Component: (props: SvgIconProps) => <FaWrapper icon={faFillDrip} {...props} /> },
  { name: 'filesShelf', Component: (props: SvgIconProps) => <FaWrapper icon={faFolderOpen} {...props} /> },
  { name: 'dippings', Component: (props: SvgIconProps) => <FaWrapper icon={faRulerVertical} {...props} /> },
  { name: 'prosAfricans', Component: (props: SvgIconProps) => <FaWrapper icon={faUsersGear} {...props} /> },

  // The rest (previously only in the old map)
  { name: 'reports', Component: AssessmentOutlined },
  { name: 'product_categories', Component: Inventory2Outlined },
  { name: 'products', Component: Inventory2Outlined },
  { name: 'manufacturingMasters', Component: TuneOutlined },
  { name: 'outlets', Component: StoreOutlined },
  { name: 'settings', Component: StoreOutlined },
  { name: 'nextSMS', Component: SmsOutlined },
  { name: 'troubleshooting', Component: TroubleshootOutlined },
  { name: 'subscriptions', Component: CardMembershipOutlined },
  { name: 'salesShifts', Component: LocalGasStation },
  { name: 'fuelMasters', Component: RoomPreferencesOutlined },
  { name: 'editAttributes', Component: EditAttributesOutlined },
  { name: 'accountTree', Component: AccountTreeOutlined },
].map((icon) => ({
  ...icon,
  // Force the default size – you can override per-icon if you ever need to
  Component: (props: SvgIconProps) => (
    <icon.Component {...props} sx={{ fontSize: ICON_SIZE, ...props.sx }} />
  ),
}));

// ---------------------------------------------------------------------
// 3. Exported values
// ---------------------------------------------------------------------
export const APP_ICONS = rawIcons;

export const iconMap = Object.fromEntries(
  rawIcons.map(({ name, Component }) => [name, <Component key={name} />])
) as Record<string, React.ReactNode>;

// Optional: helper for menus (exactly what you were using before)
export const icon = (name: keyof typeof iconMap) => iconMap[name];