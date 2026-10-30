import React from 'react';
import { readableDate, reportCostCentersToShow } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer';

const formatQuantity = (value) =>
  Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });

const formatAmount = (value) =>
  Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const StockByCostCenterPdf = ({
  report,
  store,
  authOrganization,
  user,
  dict,
}) => {
  const settings = authOrganization.organization.settings;
  const mainColor = settings?.main_color || '#2113AD';
  const lightColor = settings?.light_color || '#bec5da';
  const contrastText = settings?.contrast_text || '#FFFFFF';
  const costCenters = reportCostCentersToShow(
    report.filters.cost_centers,
    authOrganization?.costCenters
  );
  const title = store
    ? `${dict.distributionTitle} - ${store.name}`
    : dict.title;
  const withValues = report.with_values;

  const header = (flex, label, extra = {}) => (
    <Text
      style={{
        ...pdfStyles.tableCell,
        ...pdfStyles.tableHeader,
        backgroundColor: mainColor,
        color: contrastText,
        flex,
        ...extra,
      }}
    >
      {label}
    </Text>
  );

  const cell = (index, flex, value, extra = {}) => (
    <Text
      style={{
        ...pdfStyles.tableCell,
        backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
        flex,
        ...extra,
      }}
    >
      {value}
    </Text>
  );

  return (
    <Document
      creator={`${user.name} | Powered by ProsERP`}
      producer='ProsERP'
      title={`${title} ${readableDate(report.filters.as_at, true)}`}
    >
      <Page size='A4' orientation='landscape' style={pdfStyles.page}>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: 120 }}>
              <PdfLogo organization={authOrganization.organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
                {title}
              </Text>
              <Text style={pdfStyles.minInfo}>
                {`${dict.asAt} ${readableDate(report.filters.as_at, true)}`}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
          {costCenters.length > 0 && (
            <View style={{ flex: 3, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                {dict.costCenters}
              </Text>
              <Text style={pdfStyles.minInfo}>
                {costCenters.map((cc) => cc.name).join(', ')}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              {dict.printedBy}
            </Text>
            <Text style={pdfStyles.minInfo}>{user.name}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              {dict.printedOn}
            </Text>
            <Text style={pdfStyles.minInfo}>{readableDate(undefined, true)}</Text>
          </View>
        </View>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow} fixed>
            {header(0.35, dict.sn)}
            {header(3, dict.product)}
            {header(0.7, dict.unit)}
            {report.stores.map((column) =>
              header(
                1.2,
                column.direct ? `${column.name} (${dict.direct})` : column.name,
                { textAlign: 'right' }
              )
            )}
            {header(1.2, dict.total, { textAlign: 'right' })}
            {withValues && header(1.2, dict.latestRate, { textAlign: 'right' })}
            {withValues &&
              header(1.5, dict.estimatedValue, { textAlign: 'right' })}
          </View>
          {report.products.map((product, index) => (
            <View key={product.id} style={pdfStyles.tableRow} wrap={false}>
              {cell(index, 0.35, index + 1, { textAlign: 'right' })}
              {cell(index, 3, product.value_flag ? `${product.name} *` : product.name)}
              {cell(index, 0.7, product.measurement_unit?.symbol ?? '')}
              {report.stores.map((column) => (
                <React.Fragment key={column.id}>
                  {cell(
                    index,
                    1.2,
                    formatQuantity(product.store_balances[column.id] ?? 0),
                    { textAlign: 'right' }
                  )}
                </React.Fragment>
              ))}
              {cell(index, 1.2, formatQuantity(product.total_balance), {
                textAlign: 'right',
                fontWeight: 'bold',
              })}
              {withValues &&
                cell(index, 1.2, formatAmount(product.latest_rate), {
                  textAlign: 'right',
                })}
              {withValues &&
                cell(index, 1.5, formatAmount(product.total_value), {
                  textAlign: 'right',
                })}
            </View>
          ))}
          {withValues && (
            <View style={pdfStyles.tableRow} wrap={false}>
              {header(
                4.05 + report.stores.length * 1.2 + 1.2 + 1.2,
                dict.total,
                { textAlign: 'center' }
              )}
              {header(1.5, formatAmount(report.total_value), {
                textAlign: 'right',
              })}
            </View>
          )}
        </View>
        {withValues && report.products.some((product) => product.value_flag) && (
          <Text style={{ ...pdfStyles.minInfo, marginTop: 8 }}>
            {`* ${dict.valueWarning}`}
          </Text>
        )}
      </Page>
    </Document>
  );
};

export default StockByCostCenterPdf;
