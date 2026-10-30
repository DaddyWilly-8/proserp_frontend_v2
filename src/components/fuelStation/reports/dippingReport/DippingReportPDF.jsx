import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Font, Page, Text, View } from '@react-pdf/renderer';
import { useMemo } from 'react';

function DippingReportPDF({
  reportData,
  organization,
  filters,
  activeStation,
  showCumulativeDeviation = true,
  showCalculatedStock = true,
  dictionary,
}) {
  const t = dictionary.reports.fuelStationReports.dipping;
  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#bec5da';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  Font.registerHyphenationCallback((word) => [word]);

  const allReadings = reportData.flatMap((data) => data.readings); // Collect all readings in the same array

  // Step 1: Create a Map to aggregate tanks by product id
  const productMap = new Map();

  // Populate the Map with tanks grouped by checking product id
  allReadings.forEach((product) => {
    if (!productMap.has(product.id)) {
      productMap.set(product.id, {
        id: product.id,
        name: product.name,
        tanks: new Map(),
      });
    }
    const productData = productMap.get(product.id);

    // Aggregate tanks by their names
    product.tanks.forEach((tank) => {
      if (!productData.tanks.has(tank.tank)) {
        productData.tanks.set(tank.tank, {
          tank: tank.tank,
          opening: tank.opening,
          stock_in: 0,
          stock_out: 0,
          reading: tank.reading,
          calculated_stock: tank.calculated_stock,
          deviation: 0,
          cummulative_deviation: tank.cummulative_deviation,
          tank_difference: 0,
        });
      }
      const tankData = productData.tanks.get(tank.tank);

      // Only update opening if it hasn't been set before
      if (tankData.opening === undefined) {
        tankData.opening = tank?.opening || 0;
      }

      tankData.stock_in += tank.stock_in || 0;
      tankData.stock_out += tank.stock_out || 0;
      tankData.reading = tank.reading || 0;
      tankData.calculated_stock = tank.calculated_stock || 0;
      tankData.deviation += tank.deviation || 0;
      tankData.cummulative_deviation = tank.cummulative_deviation || 0;
      tankData.tank_difference = tank.tank_difference || 0;
    });
  });

  const productArray = Array.from(productMap.values()).map((product) => ({
    ...product,
    tanks: Array.from(product.tanks.values()),
  }));

  // add commulative deviation for each tank
  const processedReports = useMemo(() => {
    if (!reportData) return [];

    const cumulativeMap = {};

    return (
      [...reportData]
        // .sort((a, b) => new Date(a.as_at) - new Date(b.as_at))
        .map((report) => ({
          ...report,
          readings: report.readings.map((reading) => ({
            ...reading,
            tanks: reading.tanks.map((tank) => {
              const key = tank.tank;

              cumulativeMap[key] = (cumulativeMap[key] || 0) + tank.deviation;

              return {
                ...tank,
                accumulated_deviation: cumulativeMap[key],
              };
            }),
          })),
        }))
    );
  }, [reportData]);

  // Narrower table (one or both optional columns hidden) reads better as a
  // tall page than as a wide one with empty space on the right.
  const pageOrientation =
    showCumulativeDeviation && showCalculatedStock ? 'landscape' : 'portrait';

  // The three optional columns' widths get redistributed across whichever
  // of them stay visible, so the table always fills the row instead of
  // leaving blank space on the right where a hidden column used to be.
  // Fixed columns (Period/Details/Opening/...) keep their original widths
  // either way. Two separate weight sets because the header row and the
  // inner tank-data rows were already using two different (but
  // proportionally equivalent) width scales before this change.
  const toggleVisibility = {
    cumulativeDeviation: showCumulativeDeviation,
    calculatedStock: showCalculatedStock,
    stockDeviation: showCumulativeDeviation,
  };
  const computeToggleWidths = (weights, budget) => {
    const visibleKeys = Object.keys(weights).filter(
      (k) => toggleVisibility[k]
    );
    const total = visibleKeys.reduce((sum, k) => sum + weights[k], 0);
    const result = { cumulativeDeviation: 0, calculatedStock: 0, stockDeviation: 0 };
    if (total > 0) {
      visibleKeys.forEach((k) => {
        result[k] = (weights[k] / total) * budget;
      });
    }
    return result;
  };
  // Header row: fixed columns (Period 6 + Details 15 + Opening 7 + Stock In 7
  // + Stock Out 9 + Closing 7 + Tank Difference 10 + Deviation 6) sum to 67,
  // leaving a 33% budget for the three optional columns (13 + 10 + 10 = 33).
  const headerWidths = computeToggleWidths(
    { cumulativeDeviation: 13, calculatedStock: 10, stockDeviation: 10 },
    33
  );
  // Inner tank-data rows: fixed columns (tank name 9.5 + Opening 8 + Stock In
  // 8 + Stock Out 10.2 + Closing 8 + Tank Difference 11.3 + Deviation 6.7)
  // sum to 61.7, leaving a 38.3% budget for the three optional columns.
  const dataWidths = computeToggleWidths(
    { cumulativeDeviation: 14.5, calculatedStock: 11.3, stockDeviation: 11.4 },
    38.3
  );
  // If both switches end up off at once, all three optional columns vanish
  // and the redistribution above has nothing left to redistribute onto -
  // the budget would otherwise just sit unused as blank space again. Give
  // that leftover to Details/tank name (the one column every row already
  // has) instead of leaving it empty.
  const headerToggleUsed =
    headerWidths.cumulativeDeviation +
    headerWidths.calculatedStock +
    headerWidths.stockDeviation;
  const detailsWidth = 15 + (33 - headerToggleUsed);
  const dataToggleUsed =
    dataWidths.cumulativeDeviation +
    dataWidths.calculatedStock +
    dataWidths.stockDeviation;
  const tankNameWidth = 9.5 + (38.3 - dataToggleUsed);

  return (
    <Document
      title={`${t.title} | ${organization.name}`}
      author={reportData.creator?.name}
      subject={t.title}
      creator='Powered By ProsERP'
      producer='ProsERP'
    >
      <Page size='A3' orientation={pageOrientation} style={pdfStyles.page}>
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
            <Text style={{ ...pdfStyles.midInfo, color: mainColor }}>{t.title}</Text>
            <Text style={{ ...pdfStyles.midInfo }}>
              {`${readableDate(filters.from, true)} - ${readableDate(filters.to, true)}`}
            </Text>
          </View>
        </View>

        {processedReports.map((dipping, index) => {
          return (
            <View key={index} style={{ border: '0.5', marginTop: 20 }}>
              {/* Header Row */}
              <View style={pdfStyles.tableRow}>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    ...pdfStyles.tableCell,
                    ...pdfStyles.midInfo,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: '6%',
                  }}
                >{t.period}</Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    ...pdfStyles.tableCell,
                    ...pdfStyles.midInfo,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: `${detailsWidth}%`,
                    textAlign: 'center',
                  }}
                >{t.details}</Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    ...pdfStyles.tableCell,
                    ...pdfStyles.midInfo,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: '7%',
                  }}
                >{t.opening}</Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    ...pdfStyles.tableCell,
                    ...pdfStyles.midInfo,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: '7%',
                  }}
                >{t.stockIn}</Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    ...pdfStyles.tableCell,
                    ...pdfStyles.midInfo,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: '9%',
                  }}
                >{t.stockOut}</Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    ...pdfStyles.tableCell,
                    ...pdfStyles.midInfo,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: '7%',
                  }}
                >{t.closing}</Text>
                <Text
                  wrap
                  style={{
                    ...pdfStyles.tableHeader,
                    ...pdfStyles.tableCell,
                    ...pdfStyles.midInfo,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: '10%',
                  }}
                >{t.tankDifference}</Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    ...pdfStyles.tableCell,
                    ...pdfStyles.midInfo,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: '6%',
                  }}
                >{t.deviation}</Text>
                {showCumulativeDeviation && (
                  <Text
                    style={{
                      ...pdfStyles.tableHeader,
                      ...pdfStyles.tableCell,
                      ...pdfStyles.midInfo,
                      backgroundColor: mainColor,
                      color: contrastText,
                      width: `${headerWidths.cumulativeDeviation}%`,
                    }}
                  >{t.cumulativeDeviation}</Text>
                )}
                {showCalculatedStock && (
                  <Text
                    style={{
                      ...pdfStyles.tableHeader,
                      ...pdfStyles.tableCell,
                      ...pdfStyles.midInfo,
                      backgroundColor: mainColor,
                      color: contrastText,
                      width: `${headerWidths.calculatedStock}%`,
                    }}
                  >{t.calculatedStock}</Text>
                )}
                {showCumulativeDeviation && (
                  <Text
                    style={{
                      ...pdfStyles.tableHeader,
                      ...pdfStyles.tableCell,
                      ...pdfStyles.midInfo,
                      backgroundColor: mainColor,
                      color: contrastText,
                      width: `${headerWidths.stockDeviation}%`,
                    }}
                  >{t.stockDeviation}</Text>
                )}
              </View>

              <View style={pdfStyles.tableRow}>
                <View style={{ ...pdfStyles.tableCell, flex: 2, width: '6%' }}>
                  <Text style={{ textAlign: 'center' }}>
                    {`\n\n\n${readableDate(dipping.from, true)}\n${t.toWord}\n${readableDate(dipping.to, true)}\n\n${dipping.dippingNo}`}
                  </Text>
                </View>

                <View
                  style={{
                    ...pdfStyles.tableCell,
                    width: '94%',
                    border: '0.3',
                    padding: 0,
                  }}
                >
                  {dipping.readings.map((reading, readingIndex) => {
                    const tanks = reading.tanks;
                    // Calculate totals for the current reading
                    const readingTotals = tanks.reduce(
                      (acc, tank) => {
                        acc.opening += tank.opening || 0;
                        acc.stockIn += tank.stock_in || 0;
                        acc.stockOut += tank.stock_out || 0;
                        acc.reading += tank.reading || 0;
                        acc.tankDifference += tank.tank_difference || 0;
                        acc.deviation += tank.deviation || 0;
                        acc.calculatedStock += tank.calculated_stock || 0;
                        acc.cumulativeDeviation +=
                          tank.cummulative_deviation || 0;
                        return acc;
                      },
                      {
                        opening: 0,
                        stockIn: 0,
                        stockOut: 0,
                        reading: 0,
                        tankDifference: 0,
                        deviation: 0,
                        calculatedStock: 0,
                        cumulativeDeviation: 0,
                      }
                    );

                    let commulativeDeviation = 0;

                    return (
                      <View key={readingIndex} style={{ border: '0.3' }}>
                        <View
                          style={{
                            ...pdfStyles.tableRow,
                            marginBottom:
                              readingIndex !== dipping.readings.length - 1
                                ? 10
                                : 0,
                          }}
                        >
                          {/* fuel name */}
                          <View
                            style={{
                              ...pdfStyles.tableCell,
                              width: '7%',
                              borderBottom: 0.3,
                            }}
                          >
                            <Text>{reading.name}</Text>
                          </View>

                          <View
                            style={{
                              ...pdfStyles.tableCell,
                              width: '93%',
                              padding: 0,
                            }}
                          >
                            {tanks.map((tank, tankIndex) => {
                              const tankDifference =
                                tank.opening + tank.stock_in - tank.reading ||
                                0;

                              commulativeDeviation += tank.deviation;
                              return (
                                <View
                                  key={tankIndex}
                                  style={{ ...pdfStyles.tableRow }}
                                >
                                  {/* tank name */}
                                  <Text
                                    style={{
                                      ...pdfStyles.tableCell,
                                      width: `${tankNameWidth}%`,
                                      backgroundColor:
                                        tankIndex % 2 === 0
                                          ? '#FFFFFF'
                                          : lightColor,
                                      borderLeft: 0.3,
                                    }}
                                  >
                                    {tank.tank}
                                  </Text>
                                  {/* opening reading */}
                                  <Text
                                    style={{
                                      ...pdfStyles.tableCell,
                                      width: '8%',
                                      backgroundColor:
                                        tankIndex % 2 === 0
                                          ? '#FFFFFF'
                                          : lightColor,
                                      textAlign: 'right',
                                    }}
                                  >
                                    {tank.opening?.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }) || 0}
                                  </Text>
                                  {/* stock in */}
                                  <Text
                                    style={{
                                      ...pdfStyles.tableCell,
                                      width: '8%',
                                      backgroundColor:
                                        tankIndex % 2 === 0
                                          ? '#FFFFFF'
                                          : lightColor,
                                      textAlign: 'right',
                                    }}
                                  >
                                    {tank.stock_in?.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }) || 0}
                                  </Text>
                                  {/* stock out */}
                                  <Text
                                    style={{
                                      ...pdfStyles.tableCell,
                                      width: '10.2%',
                                      backgroundColor:
                                        tankIndex % 2 === 0
                                          ? '#FFFFFF'
                                          : lightColor,
                                      textAlign: 'right',
                                    }}
                                  >
                                    {tank.stock_out?.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }) || 0}
                                  </Text>
                                  {/* closing reading */}
                                  <Text
                                    style={{
                                      ...pdfStyles.tableCell,
                                      width: '8%',
                                      backgroundColor:
                                        tankIndex % 2 === 0
                                          ? '#FFFFFF'
                                          : lightColor,
                                      textAlign: 'right',
                                    }}
                                  >
                                    {tank.reading?.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }) || 0}
                                  </Text>
                                  {/* tank difference */}
                                  <Text
                                    style={{
                                      ...pdfStyles.tableCell,
                                      width: '11.3%',
                                      backgroundColor:
                                        tankIndex % 2 === 0
                                          ? '#FFFFFF'
                                          : lightColor,
                                      textAlign: 'right',
                                    }}
                                  >
                                    {tankDifference?.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }) || 0}
                                  </Text>
                                  {/* deviation */}
                                  <Text
                                    style={{
                                      ...pdfStyles.tableCell,
                                      width: '6.7%',
                                      backgroundColor:
                                        tankIndex % 2 === 0
                                          ? '#FFFFFF'
                                          : lightColor,
                                      textAlign: 'right',
                                    }}
                                  >
                                    {tank.deviation?.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }) || 0}
                                  </Text>
                                  {showCumulativeDeviation && (
                                    <Text
                                      style={{
                                        ...pdfStyles.tableCell,
                                        width: `${dataWidths.cumulativeDeviation}%`,
                                        backgroundColor:
                                          tankIndex % 2 === 0
                                            ? '#FFFFFF'
                                            : lightColor,
                                        textAlign: 'right',
                                      }}
                                    >
                                      {tank.accumulated_deviation.toLocaleString(
                                        'en-US',
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      ) || 0}
                                    </Text>
                                  )}
                                  {showCalculatedStock && (
                                    <Text
                                      style={{
                                        ...pdfStyles.tableCell,
                                        width: `${dataWidths.calculatedStock}%`,
                                        backgroundColor:
                                          tankIndex % 2 === 0
                                            ? '#FFFFFF'
                                            : lightColor,
                                        textAlign: 'right',
                                      }}
                                    >
                                      {tank.calculated_stock?.toLocaleString(
                                        'en-US',
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      ) || 0}
                                    </Text>
                                  )}
                                  {showCumulativeDeviation && (
                                    <Text
                                      style={{
                                        ...pdfStyles.tableCell,
                                        width: `${dataWidths.stockDeviation}%`,
                                        backgroundColor:
                                          tankIndex % 2 === 0
                                            ? '#FFFFFF'
                                            : lightColor,
                                        textAlign: 'right',
                                      }}
                                    >
                                      {tank.cummulative_deviation?.toLocaleString(
                                        'en-US',
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      ) || 0}
                                    </Text>
                                  )}
                                </View>
                              );
                            })}
                            {/* Total Row */}
                            <View style={pdfStyles.tableRow}>
                              <Text
                                style={{
                                  ...pdfStyles.tableCell,
                                  ...pdfStyles.midInfo,
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  width: `${tankNameWidth}%`,
                                  fontWeight: 'bold',
                                }}
                              >{t.totalCaps}</Text>
                              <Text
                                style={{
                                  ...pdfStyles.tableCell,
                                  ...pdfStyles.midInfo,
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  width: '8%',
                                  textAlign: 'right',
                                  fontWeight: 'bold',
                                }}
                              >
                                {readingTotals.opening?.toLocaleString(
                                  'en-US',
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                ) || 0}
                              </Text>
                              <Text
                                style={{
                                  ...pdfStyles.tableCell,
                                  ...pdfStyles.midInfo,
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  width: '8%',
                                  textAlign: 'right',
                                  fontWeight: 'bold',
                                }}
                              >
                                {readingTotals.stockIn?.toLocaleString(
                                  'en-US',
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                ) || 0}
                              </Text>
                              <Text
                                style={{
                                  ...pdfStyles.tableCell,
                                  ...pdfStyles.midInfo,
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  width: '10.2%',
                                  textAlign: 'right',
                                  fontWeight: 'bold',
                                }}
                              >
                                {readingTotals.stockOut?.toLocaleString(
                                  'en-US',
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                ) || 0}
                              </Text>
                              <Text
                                style={{
                                  ...pdfStyles.tableCell,
                                  ...pdfStyles.midInfo,
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  width: '8%',
                                  textAlign: 'right',
                                  fontWeight: 'bold',
                                }}
                              >
                                {readingTotals.reading?.toLocaleString(
                                  'en-US',
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                ) || 0}
                              </Text>
                              <Text
                                style={{
                                  ...pdfStyles.tableCell,
                                  ...pdfStyles.midInfo,
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  width: '11.3%',
                                  textAlign: 'right',
                                  fontWeight: 'bold',
                                }}
                              >
                                {readingTotals.tankDifference?.toLocaleString(
                                  'en-US',
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                ) || 0}
                              </Text>
                              <Text
                                style={{
                                  ...pdfStyles.tableCell,
                                  ...pdfStyles.midInfo,
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  width: '6.7%',
                                  textAlign: 'right',
                                  fontWeight: 'bold',
                                }}
                              >
                                {readingTotals.deviation?.toLocaleString(
                                  'en-US',
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                ) || 0}
                              </Text>
                              {showCumulativeDeviation && (
                                <Text
                                  style={{
                                    ...pdfStyles.tableCell,
                                    ...pdfStyles.midInfo,
                                    backgroundColor: mainColor,
                                    color: contrastText,
                                    width: `${dataWidths.cumulativeDeviation}%`,
                                    textAlign: 'right',
                                    fontWeight: 'bold',
                                  }}
                                ></Text>
                              )}
                              {showCalculatedStock && (
                                <Text
                                  style={{
                                    ...pdfStyles.tableCell,
                                    ...pdfStyles.midInfo,
                                    backgroundColor: mainColor,
                                    color: contrastText,
                                    width: `${dataWidths.calculatedStock}%`,
                                    textAlign: 'right',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  {readingTotals.calculatedStock?.toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  ) || 0}
                                </Text>
                              )}
                              {showCumulativeDeviation && (
                                <Text
                                  style={{
                                    ...pdfStyles.tableCell,
                                    ...pdfStyles.midInfo,
                                    backgroundColor: mainColor,
                                    color: contrastText,
                                    width: `${dataWidths.stockDeviation}%`,
                                    textAlign: 'right',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  {readingTotals.cumulativeDeviation?.toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  ) || 0}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          );
        })}

        {/* Summary */}
        <View style={{ border: '0.4', paddingTop: 20 }}>
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                ...pdfStyles.tableCell,
                ...pdfStyles.midInfo,
                backgroundColor: mainColor,
                color: contrastText,
                // flex: 1,
                width: '100%',
                textAlign: 'center',
              }}
            >{t.summary}</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                ...pdfStyles.tableCell,
                ...pdfStyles.midInfo,
                backgroundColor: mainColor,
                color: contrastText,
                // flex: 1.35,
                width: '6%',
              }}
            >{t.period}</Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                ...pdfStyles.tableCell,
                ...pdfStyles.midInfo,
                backgroundColor: mainColor,
                color: contrastText,
                // flex: 2.15,
                width: `${detailsWidth}%`,
              }}
            >{t.details}</Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                ...pdfStyles.tableCell,
                ...pdfStyles.midInfo,
                backgroundColor: mainColor,
                color: contrastText,
                // flex: 1,
                width: '7%',
              }}
            >{t.opening}</Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                ...pdfStyles.tableCell,
                ...pdfStyles.midInfo,
                backgroundColor: mainColor,
                color: contrastText,
                // flex: 1,
                width: '7%',
              }}
            >{t.stockIn}</Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                ...pdfStyles.tableCell,
                ...pdfStyles.midInfo,
                backgroundColor: mainColor,
                color: contrastText,
                // flex: 1,
                width: '9%',
              }}
            >{t.stockOut}</Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                ...pdfStyles.tableCell,
                ...pdfStyles.midInfo,
                backgroundColor: mainColor,
                color: contrastText,
                // flex: 1,
                width: '7%',
              }}
            >{t.closing}</Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                ...pdfStyles.tableCell,
                ...pdfStyles.midInfo,
                backgroundColor: mainColor,
                color: contrastText,
                // flex: 1,
                width: '10%',
              }}
            >{t.tankDifference}</Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                ...pdfStyles.tableCell,
                ...pdfStyles.midInfo,
                backgroundColor: mainColor,
                color: contrastText,
                // flex: 0.9,
                width: '6%',
              }}
            >{t.deviation}</Text>
            {showCumulativeDeviation && (
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  ...pdfStyles.tableCell,
                  ...pdfStyles.midInfo,
                  backgroundColor: mainColor,
                  color: contrastText,
                  // flex: 1,
                  width: `${headerWidths.cumulativeDeviation}%`,
                }}
              >{t.cumulativeDeviation}</Text>
            )}
            {showCalculatedStock && (
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  ...pdfStyles.tableCell,
                  ...pdfStyles.midInfo,
                  backgroundColor: mainColor,
                  color: contrastText,
                  // flex: 0.9,
                  width: `${headerWidths.calculatedStock}%`,
                }}
              >{t.calculatedStock}</Text>
            )}
            {showCumulativeDeviation && (
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  ...pdfStyles.tableCell,
                  ...pdfStyles.midInfo,
                  backgroundColor: mainColor,
                  color: contrastText,
                  // flex: 0.9,
                  width: `${headerWidths.stockDeviation}%`,
                }}
              >{t.stockDeviation}</Text>
            )}
          </View>

          <View style={pdfStyles.tableRow}>
            <View
              style={{
                ...pdfStyles.tableCell,
                width: '6%',
              }}
            >
              <Text style={{ textAlign: 'center' }}>
                {`\n${readableDate(filters.from, true)}\n${t.toWord}\n${readableDate(filters.to, true)}\n\nSUMMARY`}
              </Text>
            </View>

            <View
              style={{
                ...pdfStyles.tableCell,
                width: '94%',
                border: '0.3',
                padding: 0,
              }}
            >
              {productArray.map((product, index) => {
                // Calculate totals for the current product
                const productTotals = product.tanks.reduce(
                  (acc, tank) => {
                    acc.opening += tank.opening || 0;
                    acc.stockIn += tank.stock_in || 0;
                    acc.stockOut += tank.stock_out || 0;
                    acc.reading += tank.reading || 0;
                    acc.tankDifference += tank.tank_difference || 0;
                    acc.deviation += tank.deviation || 0;
                    acc.calculatedStock += tank.calculated_stock || 0;
                    acc.cumulativeDeviation += tank.cummulative_deviation || 0;
                    return acc;
                  },
                  {
                    opening: 0,
                    stockIn: 0,
                    stockOut: 0,
                    reading: 0,
                    tankDifference: 0,
                    deviation: 0,
                    calculatedStock: 0,
                    cumulativeDeviation: 0,
                  }
                );

                let commulativeTotal = 0;

                return (
                  <View
                    key={product.id}
                    style={{
                      ...pdfStyles.tableRow,
                      border: '0.3',
                      marginBottom: index !== productArray.length - 1 ? 10 : 0,
                    }}
                  >
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        // flex: 2,
                        width: '7%',
                      }}
                    >
                      {product.name}
                    </Text>
                    <View
                      style={{
                        ...pdfStyles.tableCell,
                        border: '0.3',
                        // flex: 15,
                        width: '93%',
                        padding: 0,
                      }}
                    >
                      {product.tanks.map((tank, tankIndex) => {
                        commulativeTotal += tank.deviation;
                        return (
                          <View
                            key={tankIndex}
                            style={{ ...pdfStyles.tableRow, border: '0.3' }}
                          >
                            {/* tank name */}
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  tankIndex % 2 === 0 ? '#FFFFFF' : lightColor,
                                // flex: 1.05,
                                width: `${tankNameWidth}%`,
                              }}
                            >
                              {tank.tank}
                            </Text>
                            {/* opening */}
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  tankIndex % 2 === 0 ? '#FFFFFF' : lightColor,
                                // flex: 1.1,
                                width: '8%',
                                textAlign: 'right',
                              }}
                            >
                              {tank.opening?.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) || 0}
                            </Text>
                            {/* stock in */}
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  tankIndex % 2 === 0 ? '#FFFFFF' : lightColor,
                                // flex: 1.1,
                                width: '8%',
                                textAlign: 'right',
                              }}
                            >
                              {tank.stock_in?.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) || 0}
                            </Text>
                            {/* stock out */}
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  tankIndex % 2 === 0 ? '#FFFFFF' : lightColor,
                                // flex: 1.1,
                                width: '10.2%',
                                textAlign: 'right',
                              }}
                            >
                              {tank.stock_out?.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) || 0}
                            </Text>
                            {/* closing reading */}
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  tankIndex % 2 === 0 ? '#FFFFFF' : lightColor,
                                // flex: 1.1,
                                width: '8%',
                                textAlign: 'right',
                              }}
                            >
                              {tank.reading?.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) || 0}
                            </Text>
                            {/* Tank Difference */}
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  tankIndex % 2 === 0 ? '#FFFFFF' : lightColor,
                                // flex: 1.1,
                                width: '11.3%',
                                textAlign: 'right',
                              }}
                            >
                              {tank.tank_difference?.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) || 0}
                            </Text>
                            {/* deviation */}
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  tankIndex % 2 === 0 ? '#FFFFFF' : lightColor,
                                // flex: 1.05,
                                width: '6.7%',
                                textAlign: 'right',
                              }}
                            >
                              {tank.deviation?.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) || 0}
                            </Text>
                            {showCumulativeDeviation && (
                              <Text
                                style={{
                                  ...pdfStyles.tableCell,
                                  backgroundColor:
                                    tankIndex % 2 === 0
                                      ? '#FFFFFF'
                                      : lightColor,
                                  // flex: 1,
                                  width: `${dataWidths.cumulativeDeviation}%`,
                                  textAlign: 'right',
                                }}
                              >
                                {commulativeTotal?.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }) || 0}
                              </Text>
                            )}
                            {showCalculatedStock && (
                              <Text
                                style={{
                                  ...pdfStyles.tableCell,
                                  backgroundColor:
                                    tankIndex % 2 === 0
                                      ? '#FFFFFF'
                                      : lightColor,
                                  // flex: 1,
                                  width: `${dataWidths.calculatedStock}%`,
                                  textAlign: 'right',
                                }}
                              >
                                {tank.calculated_stock?.toLocaleString(
                                  'en-US',
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                ) || 0}
                              </Text>
                            )}
                            {showCumulativeDeviation && (
                              <Text
                                style={{
                                  ...pdfStyles.tableCell,
                                  backgroundColor:
                                    tankIndex % 2 === 0
                                      ? '#FFFFFF'
                                      : lightColor,
                                  // flex: 1,
                                  width: `${dataWidths.stockDeviation}%`,
                                  textAlign: 'right',
                                }}
                              >
                                {tank.cummulative_deviation?.toLocaleString(
                                  'en-US',
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                ) || 0}
                              </Text>
                            )}
                          </View>
                        );
                      })}
                      {/* Total Row */}
                      <View style={pdfStyles.tableRow}>
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            ...pdfStyles.midInfo,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: `${tankNameWidth}%`,
                            fontWeight: 'bold',
                          }}
                        >{t.totalCaps}</Text>
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            ...pdfStyles.midInfo,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '8%',
                            textAlign: 'right',
                            fontWeight: 'bold',
                          }}
                        >
                          {productTotals.opening?.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || 0}
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            ...pdfStyles.midInfo,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '8%',
                            textAlign: 'right',
                            fontWeight: 'bold',
                          }}
                        >
                          {productTotals.stockIn?.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || 0}
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            ...pdfStyles.midInfo,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '10.2%',
                            textAlign: 'right',
                            fontWeight: 'bold',
                          }}
                        >
                          {productTotals.stockOut?.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || 0}
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            ...pdfStyles.midInfo,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '8%',
                            textAlign: 'right',
                            fontWeight: 'bold',
                          }}
                        >
                          {productTotals.reading?.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || 0}
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            ...pdfStyles.midInfo,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '11.3%',
                            textAlign: 'right',
                            fontWeight: 'bold',
                          }}
                        >
                          {productTotals.tankDifference?.toLocaleString(
                            'en-US',
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0}
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            ...pdfStyles.midInfo,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '6.7%',
                            textAlign: 'right',
                            fontWeight: 'bold',
                          }}
                        >
                          {productTotals.deviation?.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || 0}
                        </Text>
                        {showCumulativeDeviation && (
                          <Text
                            style={{
                              ...pdfStyles.tableCell,
                              ...pdfStyles.midInfo,
                              backgroundColor: mainColor,
                              color: contrastText,
                              width: `${dataWidths.cumulativeDeviation}%`,
                              textAlign: 'right',
                              fontWeight: 'bold',
                            }}
                          ></Text>
                        )}
                        {showCalculatedStock && (
                          <Text
                            style={{
                              ...pdfStyles.tableCell,
                              ...pdfStyles.midInfo,
                              backgroundColor: mainColor,
                              color: contrastText,
                              width: `${dataWidths.calculatedStock}%`,
                              textAlign: 'right',
                              fontWeight: 'bold',
                            }}
                          >
                            {productTotals.calculatedStock?.toLocaleString(
                              'en-US',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            ) || 0}
                          </Text>
                        )}
                        {showCumulativeDeviation && (
                          <Text
                            style={{
                              ...pdfStyles.tableCell,
                              ...pdfStyles.midInfo,
                              backgroundColor: mainColor,
                              color: contrastText,
                              width: `${dataWidths.stockDeviation}%`,
                              textAlign: 'right',
                              fontWeight: 'bold',
                            }}
                          >
                            {productTotals.cumulativeDeviation?.toLocaleString(
                              'en-US',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            ) || 0}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default DippingReportPDF;
