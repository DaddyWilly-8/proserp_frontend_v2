import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Font, Page, Text, View } from '@react-pdf/renderer';

const fmt = (value) =>
  (value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Opening of the first day, summed movements, closing of the last day - per tank
export const summarizeTankStock = (reportData) => {
  const products = new Map();
  reportData.forEach((day) => {
    day.readings.forEach((product) => {
      if (!products.has(product.id)) {
        products.set(product.id, {
          id: product.id,
          name: product.name,
          unit: product.unit,
          tanks: new Map(),
        });
      }
      const productData = products.get(product.id);
      product.tanks.forEach((tank) => {
        if (!productData.tanks.has(tank.tank)) {
          productData.tanks.set(tank.tank, {
            tank: tank.tank,
            opening: tank.opening,
            stock_in: 0,
            stock_out: 0,
            closing: tank.closing,
          });
        }
        const tankData = productData.tanks.get(tank.tank);
        tankData.stock_in += tank.stock_in || 0;
        tankData.stock_out += tank.stock_out || 0;
        tankData.closing = tank.closing;
      });
    });
  });
  return Array.from(products.values()).map((product) => ({
    ...product,
    tanks: Array.from(product.tanks.values()),
  }));
};

const totalsOf = (tanks) =>
  tanks.reduce(
    (acc, tank) => ({
      opening: acc.opening + (tank.opening || 0),
      stock_in: acc.stock_in + (tank.stock_in || 0),
      stock_out: acc.stock_out + (tank.stock_out || 0),
      closing: acc.closing + (tank.closing || 0),
    }),
    { opening: 0, stock_in: 0, stock_out: 0, closing: 0 }
  );

function TankStockReportPDF({ reportData, organization, filters, activeStation }) {
  const mainColor = organization.settings?.main_color || '#2113AD';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  Font.registerHyphenationCallback((word) => [word]);

  const headerCell = {
    ...pdfStyles.tableHeader,
    ...pdfStyles.tableCell,
    ...pdfStyles.midInfo,
    backgroundColor: mainColor,
    color: contrastText,
  };
  const numCell = { ...pdfStyles.tableCell, textAlign: 'right' };
  const totalCell = {
    ...pdfStyles.tableCell,
    ...pdfStyles.midInfo,
    backgroundColor: mainColor,
    color: contrastText,
    textAlign: 'right',
    fontWeight: 'bold',
  };

  const renderHeader = (firstLabel) => (
    <View style={pdfStyles.tableRow}>
      <Text style={{ ...headerCell, width: '16%' }}>{firstLabel}</Text>
      <Text style={{ ...headerCell, width: '16%' }}>Product</Text>
      <Text style={{ ...headerCell, width: '16%' }}>Tank</Text>
      <Text style={{ ...headerCell, width: '13%' }}>Opening</Text>
      <Text style={{ ...headerCell, width: '13%' }}>Stock In</Text>
      <Text style={{ ...headerCell, width: '13%' }}>Stock Out</Text>
      <Text style={{ ...headerCell, width: '13%' }}>Closing</Text>
    </View>
  );

  // Period spans the full height of the block, the product name spans its
  // tanks plus the TOTAL row, and the TOTAL colour only covers the tank and
  // figure columns - same structure as the Dipping Report.
  const renderProducts = (label, products) => (
    <View style={pdfStyles.tableRow}>
      <View style={{ ...pdfStyles.tableCell, width: '16%' }}>
        <Text style={{ textAlign: 'center' }}>{label}</Text>
      </View>
      <View
        style={{
          ...pdfStyles.tableCell,
          width: '84%',
          border: '0.3',
          padding: 0,
        }}
      >
        {products.map((product) => {
          const totals = totalsOf(product.tanks);
          return (
            <View
              key={product.id}
              wrap={false}
              style={{ ...pdfStyles.tableRow, border: '0.3' }}
            >
              <View style={{ ...pdfStyles.tableCell, width: '19%' }}>
                <Text>
                  {`${product.name}${product.unit ? ` (${product.unit})` : ''}`}
                </Text>
              </View>
              <View
                style={{ ...pdfStyles.tableCell, width: '81%', padding: 0 }}
              >
                {product.tanks.map((tank) => (
                  <View key={tank.tank} style={pdfStyles.tableRow}>
                    <Text style={{ ...pdfStyles.tableCell, width: '23.5%' }}>
                      {tank.tank}
                    </Text>
                    <Text style={{ ...numCell, width: '19.1%' }}>
                      {fmt(tank.opening)}
                    </Text>
                    <Text style={{ ...numCell, width: '19.1%' }}>
                      {fmt(tank.stock_in)}
                    </Text>
                    <Text style={{ ...numCell, width: '19.1%' }}>
                      {fmt(tank.stock_out)}
                    </Text>
                    <Text style={{ ...numCell, width: '19.2%' }}>
                      {fmt(tank.closing)}
                    </Text>
                  </View>
                ))}
                <View style={pdfStyles.tableRow}>
                  <Text
                    style={{ ...totalCell, width: '23.5%', textAlign: 'left' }}
                  >
                    TOTAL
                  </Text>
                  <Text style={{ ...totalCell, width: '19.1%' }}>
                    {fmt(totals.opening)}
                  </Text>
                  <Text style={{ ...totalCell, width: '19.1%' }}>
                    {fmt(totals.stock_in)}
                  </Text>
                  <Text style={{ ...totalCell, width: '19.1%' }}>
                    {fmt(totals.stock_out)}
                  </Text>
                  <Text style={{ ...totalCell, width: '19.2%' }}>
                    {fmt(totals.closing)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <Document
      title={`Tank Stock Report | ${organization.name}`}
      subject='Tank Stock Report'
      creator='Powered By ProsERP'
      producer='ProsERP'
    >
      <Page size='A4' style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View
            style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}
          >
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right', marginBottom: 5 }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
              {activeStation.name}
            </Text>
            <Text style={{ ...pdfStyles.midInfo, color: mainColor }}>
              Tank Stock Report
            </Text>
            <Text style={pdfStyles.midInfo}>
              {`${readableDate(filters.from, true)} - ${readableDate(filters.to, true)}`}
            </Text>
          </View>
        </View>

        {reportData.map((day) => (
          <View key={day.date} style={{ border: '0.5', marginTop: 15 }}>
            {renderHeader('Date')}
            {renderProducts(
              readableDate(day.date),
              day.readings.map((product) => ({
                ...product,
                tanks: product.tanks,
              }))
            )}
          </View>
        ))}

        <View style={{ border: '0.5', marginTop: 25 }} wrap={false}>
          <Text
            style={{
              ...headerCell,
              width: '100%',
              textAlign: 'center',
            }}
          >
            Summary
          </Text>
          {renderHeader('Period')}
          {renderProducts('SUMMARY', summarizeTankStock(reportData))}
        </View>
      </Page>
    </Document>
  );
}

export default TankStockReportPDF;
