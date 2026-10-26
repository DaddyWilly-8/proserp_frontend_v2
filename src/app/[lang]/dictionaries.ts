import { Dictionary } from '@/dictionaries/type';
import 'server-only';

const mergeDeep = (target: Dictionary, source: Dictionary): Dictionary => {
  for (const key of Object.keys(source)) {
    const value = source[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = mergeDeep(target[key] ?? {}, value);
    } else {
      target[key] = value;
    }
  }
  return target;
};

interface LocaleDictionary {
  [x: string]: () => Promise<Dictionary>;
}

const dictionaries: LocaleDictionary = {
  'en-US': async () => {
    const [main, organizations,measurementUnits,currencies,stakeholders,filesShelf,userManagement,productCategories,stores,products,assets,assetBookings,recurringTransactions] = await Promise.all([
      import('@/dictionaries/en/en.json').then(m => m.default),
      import('@/dictionaries/en/organizations/organizations.json').then(m => m.default),
      import('@/dictionaries/en/measurementUnits/measurementUnits.json').then(m => m.default),
      import('@/dictionaries/en/currencies/currencies.json').then(m => m.default),
      import('@/dictionaries/en/stakeholders/stakeholders.json').then(m => m.default),
      import('@/dictionaries/en/filesShelf/filesShelf.json').then(m => m.default),
      import('@/dictionaries/en/userManagement/userManagement.json').then(m => m.default),
      import('@/dictionaries/en/product/productCategories/productCategories.json').then(m =>m.default),
      import('@/dictionaries/en/product/stores/stores.json').then(m =>m.default),
      import('@/dictionaries/en/product/products.json').then(m =>m.default),
      import('@/dictionaries/en/assets/assets.json').then(m =>m.default),
      import('@/dictionaries/en/assetBookings/assetBookings.json').then(m =>m.default),
      import('@/dictionaries/en/recurringTransactions/recurringTransactions.json').then(m =>m.default)
    ]);
    const humanResources = (await Promise.all([
      import('@/dictionaries/en/humanResources/employeeProfileSections.json').then(m => m.default),
      import('@/dictionaries/en/humanResources/employees.json').then(m => m.default),
      import('@/dictionaries/en/humanResources/loansAndDeductions.json').then(m => m.default),
      import('@/dictionaries/en/humanResources/myHrAndDashboard.json').then(m => m.default),
      import('@/dictionaries/en/humanResources/payrollPeriods.json').then(m => m.default),
      import('@/dictionaries/en/humanResources/payrollRunsAndBanks.json').then(m => m.default),
      import('@/dictionaries/en/humanResources/reportsAttendanceHolidays.json').then(m => m.default),
      import('@/dictionaries/en/humanResources/setupTypes.json').then(m => m.default)
    ])).reduce((merged, part) => mergeDeep(merged, part), {} as Dictionary);
    const forms = (await Promise.all([
      import('@/dictionaries/en/forms/accountsAndMasters.json').then(m => m.default),
      import('@/dictionaries/en/forms/adminAndAuth.json').then(m => m.default),
      import('@/dictionaries/en/forms/pos.json').then(m => m.default),
      import('@/dictionaries/en/forms/procurementAndProducts.json').then(m => m.default),
      import('@/dictionaries/en/forms/productionAndFuel.json').then(m => m.default),
      import('@/dictionaries/en/forms/projectsAndMisc.json').then(m => m.default),
      import('@/dictionaries/en/forms/requisitionsAndRfqs.json').then(m => m.default)
    ])).reduce((merged, part) => mergeDeep(merged, part), {} as Dictionary);
    const projectManagement = (await Promise.all([
      import('@/dictionaries/en/projectManagement/projectsCore.json').then(m => m.default),
      import('@/dictionaries/en/projectManagement/wbsBudgetsClaims.json').then(m => m.default)
    ])).reduce((merged, part) => mergeDeep(merged, part), {} as Dictionary);
    const reports = (await Promise.all([
      import('@/dictionaries/en/reports/accountsReports.json').then(m => m.default),
      import('@/dictionaries/en/reports/fuelAndPosReports.json').then(m => m.default),
      import('@/dictionaries/en/reports/operationsReports.json').then(m => m.default)
    ])).reduce((merged, part) => mergeDeep(merged, part), {} as Dictionary);
    return {
      ...main,
      organizations,
      measurementUnits,
      currencies,
      stakeholders,
      filesShelf,
      userManagement,
      productCategories,
      stores,
      products,
      ...assets,
      ...assetBookings,
      ...recurringTransactions,
      humanResources,
      forms: { ...main.forms, ...forms },
      projectManagement,
      reports: { ...assets.reports, ...reports }

    };
  },
  'sw-TZ': async () => {
    const [main, organizations,measurementUnits,currencies,stakeholders,filesShelf,userManagement,productCategories,stores,products,assets,assetBookings,recurringTransactions] = await Promise.all([
      import('@/dictionaries/sw/sw.json').then(m => m.default),
      import('@/dictionaries/sw/organizations/organizations.json').then(m => m.default),
      import('@/dictionaries/sw/measurementUnits/measurementUnits.json').then(m => m.default),
      import('@/dictionaries/sw/currencies/currencies.json').then(m => m.default),
      import('@/dictionaries/sw/stakeholders/stakeholders.json').then(m => m.default),
      import('@/dictionaries/sw/filesShelf/filesShelf.json').then(m => m.default),
      import('@/dictionaries/sw/userManagement/userManagement.json').then(m => m.default),
      import('@/dictionaries/sw/product/productCategories/productCategories.json').then(m =>m.default),
      import('@/dictionaries/sw/product/stores/stores.json').then(m =>m.default),
      import('@/dictionaries/sw/product/products.json').then(m =>m.default),
      import('@/dictionaries/sw/assets/assets.json').then(m =>m.default),
      import('@/dictionaries/sw/assetBookings/assetBookings.json').then(m =>m.default),
      import('@/dictionaries/sw/recurringTransactions/recurringTransactions.json').then(m =>m.default)
    ]);
    const humanResources = (await Promise.all([
      import('@/dictionaries/sw/humanResources/employeeProfileSections.json').then(m => m.default),
      import('@/dictionaries/sw/humanResources/employees.json').then(m => m.default),
      import('@/dictionaries/sw/humanResources/loansAndDeductions.json').then(m => m.default),
      import('@/dictionaries/sw/humanResources/myHrAndDashboard.json').then(m => m.default),
      import('@/dictionaries/sw/humanResources/payrollPeriods.json').then(m => m.default),
      import('@/dictionaries/sw/humanResources/payrollRunsAndBanks.json').then(m => m.default),
      import('@/dictionaries/sw/humanResources/reportsAttendanceHolidays.json').then(m => m.default),
      import('@/dictionaries/sw/humanResources/setupTypes.json').then(m => m.default)
    ])).reduce((merged, part) => mergeDeep(merged, part), {} as Dictionary);
    const forms = (await Promise.all([
      import('@/dictionaries/sw/forms/accountsAndMasters.json').then(m => m.default),
      import('@/dictionaries/sw/forms/adminAndAuth.json').then(m => m.default),
      import('@/dictionaries/sw/forms/pos.json').then(m => m.default),
      import('@/dictionaries/sw/forms/procurementAndProducts.json').then(m => m.default),
      import('@/dictionaries/sw/forms/productionAndFuel.json').then(m => m.default),
      import('@/dictionaries/sw/forms/projectsAndMisc.json').then(m => m.default),
      import('@/dictionaries/sw/forms/requisitionsAndRfqs.json').then(m => m.default)
    ])).reduce((merged, part) => mergeDeep(merged, part), {} as Dictionary);
    const projectManagement = (await Promise.all([
      import('@/dictionaries/sw/projectManagement/projectsCore.json').then(m => m.default),
      import('@/dictionaries/sw/projectManagement/wbsBudgetsClaims.json').then(m => m.default)
    ])).reduce((merged, part) => mergeDeep(merged, part), {} as Dictionary);
    const reports = (await Promise.all([
      import('@/dictionaries/sw/reports/accountsReports.json').then(m => m.default),
      import('@/dictionaries/sw/reports/fuelAndPosReports.json').then(m => m.default),
      import('@/dictionaries/sw/reports/operationsReports.json').then(m => m.default)
    ])).reduce((merged, part) => mergeDeep(merged, part), {} as Dictionary);
    return {
      ...main,
      organizations,
      measurementUnits,
      currencies,
      stakeholders,
      filesShelf,
      userManagement,
      productCategories,
      stores,
      products,
      ...assets,
      ...assetBookings,
      ...recurringTransactions,
      humanResources,
      forms: { ...main.forms, ...forms },
      projectManagement,
      reports: { ...assets.reports, ...reports }
    };
  },

  // 'ar-SA': () =>ww
  //   import('@/dictionaries/ar.json').then((module) => module.default),
  // 'es-ES': () =>
  //   import('@/dictionaries/es.json').then((module) => module.default),
  // 'fr-FR': () =>
  //   import('@/dictionaries/fr.json').then((module) => module.default),
  // 'it-IT': () =>
  //   import('@/dictionaries/it.json').then((module) => module.default),
  // 'zh-CN': () =>
  //   import('@/dictionaries/zh.json').then((module) => module.default),
};

export const getDictionary = async (locale: string) => {
  const dictionaryLoader = dictionaries[locale] || dictionaries['en-US'];
  return dictionaryLoader();
};