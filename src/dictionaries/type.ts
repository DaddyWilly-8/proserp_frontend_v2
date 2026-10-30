import type Main from './en/en.json';
import type OrganizationsDictionary from './en/organizations/organizations.json';
import type MeasurementUnitsDictionary from './en/measurementUnits/measurementUnits.json';
import type CurrenciesDictionary from './en/currencies/currencies.json';
import type StakeholdersDictionary from './en/stakeholders/stakeholders.json';
import type FilesShelfDictionary from './en/filesShelf/filesShelf.json';
import type UserManagementDictionary from './en/userManagement/userManagement.json';
import type ProductCategoriesDictionary from './en/product/productCategories/productCategories.json';
import type StoresDictionary from './en/product/stores/stores.json';
import type ProductsDictionary from './en/product/products.json';
import type Assets from './en/assets/assets.json';
import type AssetBookings from './en/assetBookings/assetBookings.json';
import type RecurringTransactions from './en/recurringTransactions/recurringTransactions.json';
import type HumanResourcesEmployeeProfileSections from './en/humanResources/employeeProfileSections.json';
import type HumanResourcesEmployees from './en/humanResources/employees.json';
import type HumanResourcesLoansAndDeductions from './en/humanResources/loansAndDeductions.json';
import type HumanResourcesMyHrAndDashboard from './en/humanResources/myHrAndDashboard.json';
import type HumanResourcesPayrollPeriods from './en/humanResources/payrollPeriods.json';
import type HumanResourcesPayrollRunsAndBanks from './en/humanResources/payrollRunsAndBanks.json';
import type HumanResourcesReportsAttendanceHolidays from './en/humanResources/reportsAttendanceHolidays.json';
import type HumanResourcesSetupTypes from './en/humanResources/setupTypes.json';
import type FormsAccountsAndMasters from './en/forms/accountsAndMasters.json';
import type FormsAdminAndAuth from './en/forms/adminAndAuth.json';
import type FormsPos from './en/forms/pos.json';
import type FormsProcurementAndProducts from './en/forms/procurementAndProducts.json';
import type FormsProductionAndFuel from './en/forms/productionAndFuel.json';
import type FormsProjectsAndMisc from './en/forms/projectsAndMisc.json';
import type FormsRequisitionsAndRfqs from './en/forms/requisitionsAndRfqs.json';
import type ProjectManagementProjectsCore from './en/projectManagement/projectsCore.json';
import type ProjectManagementWbsBudgetsClaims from './en/projectManagement/wbsBudgetsClaims.json';
import type ReportsAccountsReports from './en/reports/accountsReports.json';
import type ReportsFuelAndPosReports from './en/reports/fuelAndPosReports.json';
import type ReportsOperationsReports from './en/reports/operationsReports.json';

// Shape of the dictionary, derived from the English JSON files. Keep this in step with
// src/app/[lang]/dictionaries.ts (npm run check:i18n verifies every file is listed in both).

/** Loose shape used while the dictionary is being assembled and merged. */
export interface LooseDictionary {
  [x: string]: any;
}

export type Dictionary = typeof Main &
  {
    organizations: typeof OrganizationsDictionary;
    measurementUnits: typeof MeasurementUnitsDictionary;
    currencies: typeof CurrenciesDictionary;
    stakeholders: typeof StakeholdersDictionary;
    filesShelf: typeof FilesShelfDictionary;
    userManagement: typeof UserManagementDictionary;
    productCategories: typeof ProductCategoriesDictionary;
    stores: typeof StoresDictionary;
    products: typeof ProductsDictionary;
  } &
  typeof Assets &
  typeof AssetBookings &
  typeof RecurringTransactions & {
    humanResources: typeof HumanResourcesEmployeeProfileSections &
      typeof HumanResourcesEmployees &
      typeof HumanResourcesLoansAndDeductions &
      typeof HumanResourcesMyHrAndDashboard &
      typeof HumanResourcesPayrollPeriods &
      typeof HumanResourcesPayrollRunsAndBanks &
      typeof HumanResourcesReportsAttendanceHolidays &
      typeof HumanResourcesSetupTypes;
    forms: typeof Main['forms'] &
      typeof FormsAccountsAndMasters &
      typeof FormsAdminAndAuth &
      typeof FormsPos &
      typeof FormsProcurementAndProducts &
      typeof FormsProductionAndFuel &
      typeof FormsProjectsAndMisc &
      typeof FormsRequisitionsAndRfqs;
    projectManagement: typeof ProjectManagementProjectsCore &
      typeof ProjectManagementWbsBudgetsClaims;
    reports: typeof Assets['reports'] &
      typeof ReportsAccountsReports &
      typeof ReportsFuelAndPosReports &
      typeof ReportsOperationsReports;
  };
