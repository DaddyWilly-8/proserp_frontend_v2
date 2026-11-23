import React from 'react';
import { readableDate, reportCostCentersToShow } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer';

const formatQuantity = (value) =>
  Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 });

const formatAmount = (value) =>
  Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const StockTransfersPdf = ({ report, authOrganization, user, dict }) => {
  const settings = authOrganization.organization.settings;
  const mainColor = settings?.main_color || '#2113AD';
  const lightColor = settings?.light_color || '#bec5da';
  const contrastText = settings?.contrast_text || '#FFFFFF';
  const sourceCostCenters = reportCostCentersToShow(
    report.filters.source_cost_centers,
    authOrganization?.costCenters
  );
  const destinationCostCenters = reportCostCentersToShow(
    report.filters.destination_cost_centers,
    authOrganization?.costCenters
  );
  const withValues = report.with_values;
  const period = `${readableDate(report.filters.from, true)} - ${readableDate(report.filters.to, true)}`;

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

  const right = { textAlign: 'right' };
  const filterBlock = (label, value) => (
    <View style={{ flex: 1, padding: 2 }}>
      <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>{label}</Text>
      <Text style={pdfStyles.minInfo}>{value}</Text>
    </View>
  );

  return (
    <Document
      creator={`${user.name} | Powered by ProsERP`}
      producer='ProsERP'
      title={`${dict.title} ${period}`}
    >
      <Page size='A4' orientation='landscape' style={pdfStyles.page}>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: 120 }}>
              <PdfLogo organization={authOrganization.organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
                {dict.title}
              </Text>
              <Text style={pdfStyles.minInfo}>{period}</Text>
            </View>
          </View>
        </View>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
          {report.filters.source_stores.length > 0 &&
            filterBlock(dict.fromStore, report.filters.source_stores.join(', '))}
          {report.filters.destination_stores.length > 0 &&
            filterBlock(dict.toStore, report.filters.destination_stores.join(', '))}
          {sourceCostCenters.length > 0 &&
            filterBlock(dict.sourceCostCenters, sourceCostCenters.map((cc) => cc.name).join(', '))}
          {destinationCostCenters.length > 0 &&
            filterBlock(dict.destinationCostCenters, destinationCostCenters.map((cc) => cc.name).join(', '))}
          {filterBlock(dict.printedBy, user.name)}
          {filterBlock(dict.printedOn, readableDate(undefined, true))}
        </View>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow} fixed>
            {header(0.35, dict.sn)}
            {header(3, dict.product)}
            {header(0.6, dict.unit)}
            {report.stores.map((column) => (
              <React.Fragment key={column.id}>
                {header(2, column.name, { textAlign: 'center' })}
              </React.Fragment>
            ))}
            {header(2, dict.total, { textAlign: 'center' })}
            {withValues && header(1.4, dict.value, right)}
            {withValues && header(1.4, dict.valueReceived, right)}
          </View>
          <View style={pdfStyles.tableRow} fixed>
            {header(3.95, '')}
            {[...report.stores, { id: 'total' }].map((column) => (
              <React.Fragment key={column.id}>
                {header(1, dict.sent, right)}
                {header(1, dict.received, right)}
              </React.Fragment>
            ))}
            {withValues && header(2.8, '')}
          </View>
          {report.products.map((product, index) => (
            <View key={product.id} style={pdfStyles.tableRow} wrap={false}>
              {cell(index, 0.35, index + 1, right)}
              {cell(index, 3, product.name)}
              {cell(index, 0.6, product.unit)}
              {report.stores.map((column) => (
                <React.Fragment key={column.id}>
                  {cell(index, 1, formatQuantity(product.store_sent[column.id] ?? 0), right)}
                  {cell(index, 1, formatQuantity(product.store_received[column.id] ?? 0), right)}
                </React.Fragment>
              ))}
              {cell(index, 1, formatQuantity(product.total_sent), { ...right, fontWeight: 'bold' })}
              {cell(index, 1, formatQuantity(product.total_received), { ...right, fontWeight: 'bold' })}
              {withValues && cell(index, 1.4, formatAmount(product.total_value), right)}
              {withValues && cell(index, 1.4, formatAmount(product.total_received_value), right)}
            </View>
          ))}
          {withValues && (
            <View style={pdfStyles.tableRow} wrap={false}>
              {header(3.95 + (report.stores.length + 1) * 2, dict.total, { textAlign: 'center' })}
              {header(1.4, formatAmount(report.total_value), right)}
              {header(1.4, formatAmount(report.total_received_value), right)}
            </View>
          )}
        </View>
        <Text style={{ ...pdfStyles.minInfo, marginTop: 8 }}>
          {dict.pendingNote}
        </Text>
      </Page>
    </Document>
  );
};

export default StockTransfersPdf;
