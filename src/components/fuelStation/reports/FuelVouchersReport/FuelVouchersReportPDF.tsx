import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs';

interface FuelVouchersReportPDFProps {
  reportData: any;
  organization: any;
  filters: any;
  dictionary: any;
}

function FuelVouchersReportPDF({
  reportData,
  organization,
  filters,
  dictionary,
}: FuelVouchersReportPDFProps) {
  const t = dictionary.reports.fuelStationReports.fuelVouchers;
  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#bec5da';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const totalLts = reportData.reduce(
    (sum: any, fv: any) => sum + fv.quantity,
    0
  );

  const totalAmount = reportData.reduce(
    (sum: any, fv: any) => sum + fv.quantity * fv.price,
    0
  );

  let runningBalance: number = 0;

  // total column width
  let filtersTableWidth = '0%';
  if (
    filters.stakeholder_name === '' &&
    (filters.expense_ledger_ids?.length !== 1 || !filters.expense_ledger_ids)
  ) {
    filtersTableWidth = '100%';
  }
  if (filters.with_receipts == 1 && filters.stakeholder_name) {
    filtersTableWidth = '89%';
  } else {
    filtersTableWidth = '76%';
  }
  return (
    <Document
      title={`${t.title} | ${organization.name}`}
      author={filters.stationName}
      subject={t.title}
      creator={`Powered By ProsERP`}
      producer='ProsERP'
    >
      <Page size='A4' orientation='landscape' style={pdfStyles.page}>
        {/* ================= HEADER ================= */}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View
            style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}
          >
            <PdfLogo organization={organization} />
          </View>
        </View>
        {/* ===== FILTERS ===== */}
        <View style={{ ...pdfStyles.table, width: filtersTableWidth }}>
          <View style={{ ...pdfStyles.tableRow }}>
            {filters.stationName && (
              <View style={{ ...pdfStyles.tableCell, flex: 1 }}>
                <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>{t.stationName}</Text>
              </View>
            )}
            {((filters.stakeholder_name && filters.stakeholder_name !== '') ||
              (filters.expense_ledger_ids &&
                filters.expense_ledger_ids?.length === 1)) && (
              <View style={{ ...pdfStyles.tableCell, flex: 1 }}>
                <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
                  {filters.stakeholder_name &&
                    filters.stakeholder_name !== '' &&
                    t.clientName}
                  {filters.expense_ledger_ids &&
                    filters.expense_ledger_ids?.length === 1 &&
                    t.expense}
                </Text>
              </View>
            )}
            {filters.from && filters.to && (
              <View style={{ ...pdfStyles.tableCell, flex: 1 }}>
                <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>{t.dateRange}</Text>
              </View>
            )}
          </View>
          <View style={{ ...pdfStyles.tableRow }}>
            {filters.stationName && (
              <View style={{ ...pdfStyles.tableCell, flex: 1 }}>
                <Text style={{ ...pdfStyles.majorInfo, color: 'black' }}>
                  {filters.stationName}
                </Text>
              </View>
            )}

            {((filters.stakeholder_name && filters.stakeholder_name !== '') ||
              (filters.expense_ledger_ids &&
                filters.expense_ledger_ids?.length === 1)) && (
              <View style={{ ...pdfStyles.tableCell, flex: 1 }}>
                <Text style={{ ...pdfStyles.majorInfo, color: 'black' }}>
                  {filters.stakeholder_name &&
                    filters.stakeholder_name !== '' &&
                    filters.stakeholder_name}
                  {filters.expense_ledger_ids &&
                    filters.expense_ledger_ids?.length === 1 &&
                    reportData[0]?.expense_ledger.name}
                </Text>
              </View>
            )}

            {filters.from && filters.to && (
              <View style={{ ...pdfStyles.tableCell, flex: 1 }}>
                <Text style={{ ...pdfStyles.majorInfo, color: 'black' }}>
                  {`${filters.from} - ${filters.to}`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ===== FUEL VOUCHERS ===== */}
        <View style={{ marginBottom: 12 }}>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  width:
                    filters.with_receipts == 1 && filters.stakeholder_name
                      ? '7%'
                      : '13%',
                }}
              >{t.date}</Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  width:
                    filters.with_receipts == 1 && filters.stakeholder_name
                      ? '9%'
                      : '17%',
                }}
              >{t.voucherNo}</Text>
              {filters.stakeholder_name === '' &&
                (filters.expense_ledger_ids?.length !== 1 ||
                  !filters.expense_ledger_ids) && (
                  <Text
                    style={{
                      ...pdfStyles.tableHeader,
                      backgroundColor: mainColor,
                      color: contrastText,
                      width:
                        filters.with_receipts == 1 && filters.stakeholder_name
                          ? '12%'
                          : '22%',
                    }}
                  >
                    {!filters.stakeholder_name &&
                      (filters.expense_ledger_ids?.length < 1 ||
                        !filters.expense_ledger_ids) &&
                      t.clientExpense}
                    {(!filters.stakeholder_name ||
                      filters.stakeholder_name === '') &&
                      filters.expense_ledger_ids?.length > 1 &&
                      t.expense}
                  </Text>
                )}
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  width: '11%',
                }}
              >{t.reference}</Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  width:
                    filters.with_receipts == 1 && filters.stakeholder_name
                      ? '17%'
                      : '16%',
                }}
              >{t.product}</Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  width:
                    filters.stakeholder_name === '' &&
                    (filters.expense_ledger_ids?.length !== 1 ||
                      !filters.expense_ledger_ids)
                      ? '21%'
                      : filters.with_receipts == 1 && filters.stakeholder_name
                        ? '17%'
                        : '16%',
                }}
              >{t.narration}</Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  width:
                    filters.with_receipts == 1 && filters.stakeholder_name
                      ? '5%'
                      : '7%',
                }}
              >{t.lts}</Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  width: '9%',
                }}
              >{t.price}</Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  width: '11%',
                }}
              >
                {`${filters.with_receipts == 1 && filters.stakeholder_name ? t.debit : t.amount}`}
              </Text>
              {filters.with_receipts == 1 && filters.stakeholder_name && (
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: '10%',
                  }}
                >{t.credit}</Text>
              )}
              {filters.with_receipts == 1 && filters.stakeholder_name && (
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: '14%',
                  }}
                >{t.runningBalance}</Text>
              )}
            </View>
            {reportData.length &&
              reportData.map((rd: any, index: number) => {
                runningBalance += rd.debit - rd.credit;
                return (
                  <View key={index} style={pdfStyles.tableRow}>
                    {/* date */}
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        width:
                          filters.with_receipts == 1 && filters.stakeholder_name
                            ? '7%'
                            : '13%',
                      }}
                    >
                      {dayjs(rd.transaction_date).format('DD-MM-YYYY')}
                    </Text>
                    {/* Voucher No */}
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        width:
                          filters.with_receipts == 1 && filters.stakeholder_name
                            ? '9%'
                            : '17%',
                        textAlign: 'left',
                      }}
                    >
                      {rd.voucherNo}
                    </Text>
                    {/* Client/Expense Ledger */}
                    {filters.stakeholder_name === '' &&
                      (filters.expense_ledger_ids?.length !== 1 ||
                        !filters.expense_ledger_ids) && (
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            backgroundColor:
                              index % 2 === 0 ? '#FFFFFF' : lightColor,
                            width:
                              filters.with_receipts == 1 &&
                              filters.stakeholder_name
                                ? '12%'
                                : '22%',
                            textAlign: 'left',
                          }}
                        >
                          {rd.expense_ledger?.name || rd.stakeholder?.name}
                        </Text>
                      )}
                    {/* Reference */}
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        width: '11%',
                        textAlign: 'left',
                      }}
                    >
                      {rd.reference || ''}
                    </Text>
                    {/* Product */}
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        width:
                          filters.with_receipts == 1 && filters.stakeholder_name
                            ? '17%'
                            : '16%',
                        textAlign: 'left',
                      }}
                    >
                      {rd.product?.name}
                    </Text>
                    {/* Narration */}
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        width:
                          filters.stakeholder_name === '' &&
                          (filters.expense_ledger_ids?.length !== 1 ||
                            !filters.expense_ledger_ids)
                            ? '21%'
                            : filters.with_receipts == 1 &&
                                filters.stakeholder_name
                              ? '17%'
                              : '16%',
                        textAlign: 'left',
                      }}
                    >
                      {rd.narration}
                    </Text>
                    {/* LTS */}
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        width:
                          filters.with_receipts == 1 && filters.stakeholder_name
                            ? '5%'
                            : '7%',
                        textAlign: 'right',
                      }}
                    >
                      {rd.quantity?.toLocaleString('en-US', {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                    {/* price */}
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        width: '9%',
                        textAlign: 'right',
                      }}
                    >
                      {rd.price?.toLocaleString('en-US', {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                    {/* AMOUNT */}
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        width: '11%',
                        textAlign: 'right',
                      }}
                    >
                      {filters.with_receipts == 0
                        ? rd.amount?.toLocaleString('en-US', {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          })
                        : rd.debit?.toLocaleString('en-US', {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          })}
                    </Text>
                    {filters.with_receipts == 1 && filters.stakeholder_name && (
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor:
                            index % 2 === 0 ? '#FFFFFF' : lightColor,
                          width: '10%',
                          textAlign: 'right',
                        }}
                      >
                        {rd.credit.toLocaleString('en-US', {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })}
                      </Text>
                    )}
                    {filters.with_receipts == 1 && filters.stakeholder_name && (
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor:
                            index % 2 === 0 ? '#FFFFFF' : lightColor,
                          width: '14%',
                          textAlign: 'right',
                        }}
                      >
                        {runningBalance.toLocaleString('en-US', {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })}
                      </Text>
                    )}
                  </View>
                );
              })}

            {/* TOTALS */}
            {reportData.length && (
              <View style={pdfStyles.tableRow}>
                {filters.stakeholder_name === '' &&
                  (filters.expense_ledger_ids?.length !== 1 ||
                    !filters.expense_ledger_ids) && (
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor: mainColor,
                        color: contrastText,
                        width: '100%',
                      }}
                    >{t.totalCaps}</Text>
                  )}
                {((filters.stakeholder_name != '' &&
                  filters.stakeholder_name) ||
                  (filters.expense_ledger_ids?.length === 1 &&
                    filters.expense_ledger_ids)) && (
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: mainColor,
                      color: contrastText,
                      width:
                        filters.with_receipts == 1 && filters.stakeholder_name
                          ? '61.5%'
                          : '73.5%',
                    }}
                  >{t.totalCaps}</Text>
                )}
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width:
                      filters.with_receipts == 1 && filters.stakeholder_name
                        ? '5%'
                        : '7%',
                    textAlign: 'right',
                  }}
                >
                  {totalLts.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: '9%',
                    textAlign: 'right',
                  }}
                ></Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: '11%',
                    textAlign: 'right',
                  }}
                >
                  {totalAmount.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </Text>
                {filters.with_receipts == 1 && filters.stakeholder_name && (
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: mainColor,
                      color: contrastText,
                      width: '10%',
                      textAlign: 'right',
                    }}
                  ></Text>
                )}
                {filters.with_receipts == 1 && filters.stakeholder_name && (
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: mainColor,
                      color: contrastText,
                      width: '14%',
                      textAlign: 'right',
                    }}
                  ></Text>
                )}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default FuelVouchersReportPDF;
