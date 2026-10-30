import pdfStyles from '@/components/pdf/pdf-styles';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import React from 'react'

function ZReportPDF({reportData, authOrganization, user, thermalPrinter, dictionary}) {
    const t = dictionary.reports.accountsReports.zReport;
    const organization = authOrganization.organization;
    const TotalVATIncl = reportData.totalGross - 0;
    const TotalVATExcl = reportData.totalGross - reportData.totaltax;
    const TotalVAT = reportData.totaltax - 0;
    const TotalNetABC = reportData.totalNetABC - 0;
    const TotalNetDE = reportData.totalNetDE - 0;
    // smart_efd returns one row per tax group, in A-E order, each with its
    // own gross/net/tax - the template used to ignore this entirely and
    // dump the whole report's totals under "A", leaving B-E hardcoded at
    // 0.00 regardless of what was actually exempt/zero-rated.
    const taxRows = reportData.totals || [];
    const formatAmt = (value) => (parseFloat(value) || 0).toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2});
    // smart_efd's own `text` field is always numeric ("B - 0.00", "E - 0.00")
    // even though the real TRA printout uses the group's fixed code instead
    // of a rate for every group but A (e.g. "TAX: E - EX") - A is the only
    // group whose label is an actual percentage, and that rate is the
    // org's configured VAT rate, not something smart_efd sends per report.
    const vatPercentage = organization?.settings?.vat_percentage ?? 18;
    const TAX_GROUP_CODES = { 1: 'SR', 2: 'ZR', 3: 'SR', 4: 'EX' };
    const taxRowLabel = (index, letter) => index === 0
        ? `${t.tax} A - ${Number(vatPercentage).toFixed(2)}%`
        : `${t.tax} ${letter} - ${TAX_GROUP_CODES[index]}`;

    const PDF80mm = () => (
        <Page size={[80 * 2.83465, 297 * 2.83465]}  style={{...pdfStyles.page, padding: 10, scale: 0.7 }}>
    
            <View style={{ ...pdfStyles.tableRow, textAlign: 'center'}}>
              <View style={{ flex: 1}}> 
                <Text style={{...pdfStyles.midInfo, fontFamily: 'Helvetica-Bold'}}>{reportData.name}</Text>
              </View>
            </View>
    
            <View style={{ ...pdfStyles.tableRow, textAlign: 'center'}}>
              <View style={{flex:0.4}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold', textAlign: 'right'}}>{t.mobile}</Text>
              </View>
              <View style={{flex:0.6}}>
                <Text style={{...pdfStyles.minInfo, textAlign: 'left'}}>{organization.phone}</Text>
              </View>
            </View>
    
            <View style={{ ...pdfStyles.tableRow, textAlign: 'center'}}>
              <View style={{flex:0.4}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold', textAlign: 'right'}}>TIN:</Text>
              </View>
              <View style={{flex:0.6}}>
                <Text style={{...pdfStyles.minInfo, textAlign: 'left'}}>{reportData.tin}</Text>
              </View>
            </View>
    
            <View style={{ ...pdfStyles.tableRow, textAlign: 'center'}}>
              <View style={{flex:0.4}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold', textAlign: 'right'}}>VRN:</Text>
              </View>
              <View style={{flex:0.6}}>
                <Text style={{...pdfStyles.minInfo, textAlign: 'left'}}>{reportData.vrn}</Text>
              </View>
            </View>
    
            <View style={{ ...pdfStyles.tableRow, textAlign: 'center'}}>
              <View style={{flex:0.4}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold', textAlign: 'right'}}>{t.serialNumber}</Text>
              </View>
              <View style={{flex:0.6}}>
                <Text style={{...pdfStyles.minInfo, textAlign: 'left'}}>{organization.tra_serial_number}</Text>
              </View>
            </View>
    
            <View style={{ ...pdfStyles.tableRow, textAlign: 'center'}}>
              <View style={{flex:0.1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold', textAlign: 'right'}}>UIN:</Text>
              </View>
              <View style={{flex:0.9}}>
                <Text style={{...pdfStyles.minInfo, textAlign: 'left'}}>{reportData.uin}</Text>
              </View>
            </View>
    
            <View style={{ ...pdfStyles.tableRow, textAlign: 'center'}}>
              <View style={{flex:0.3}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold', textAlign: 'right'}}>{t.taxOffice}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex:0.7}}>
                <Text style={{...pdfStyles.minInfo, textAlign: 'left'}}>{reportData.taxOffice}</Text>
              </View>
            </View>
    
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{...pdfStyles.blackLine,flex:1}}>
              </View>
            </View>
    
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{t.date}</Text>
                <Text style={{...pdfStyles.minInfo}}>{reportData.date}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{t.time}</Text>
                <Text style={{...pdfStyles.minInfo}}>{reportData.time}</Text>
              </View>
            </View>
    
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.dottedLine, fontFamily: 'Helvetica-Bold'}}>........................................</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow, ...pdfStyles.textBold, textAlign: 'center'}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, marginTop: 3, fontFamily: 'Helvetica-Bold'}}>{t.title.toUpperCase()}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.dottedLine, fontFamily: 'Helvetica-Bold'}}>........................................</Text>
              </View>
            </View>
    
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.discount} `}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>0.00</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.amount} `}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>0.00</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.markup} `}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>0.00</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.amount} `}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>0.00</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.money} `}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{TotalVATIncl.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>
    
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.dottedLine, fontFamily: 'Helvetica-Bold'}}>........................................</Text>
              </View>
            </View>
    
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.firstReceipt} `}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{reportData.from}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.lastReceipt} `}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{reportData.to}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.receiptsIssued} `}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{(reportData.ticketsFiscal - 0).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.corrections} `}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{(reportData.corrections - 0).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>
    
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.dottedLine, fontFamily: 'Helvetica-Bold'}}>........................................</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow, textAlign: 'center'}}>
              <View style={{ flex: 1, marginTop: 3}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{t.paymentReport}</Text>
              </View>
            </View> 
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.dottedLine, fontFamily: 'Helvetica-Bold'}}>........................................</Text>
              </View>
            </View>
    
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.cash} `}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{TotalVATIncl.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.total} `}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{TotalVATIncl.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>
    
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.dottedLine, fontFamily: 'Helvetica-Bold'}}>........................................</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow, ...pdfStyles.textBold, textAlign: 'center'}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{t.taxReport}</Text>
              </View>
            </View> 
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.dottedLine, fontFamily: 'Helvetica-Bold'}}>........................................</Text>
              </View>
            </View>
    
            {['A','B','C','D','E'].map((letter, index) => (
            <React.Fragment key={letter}>
            <View style={{ ...pdfStyles.tableRow, marginTop: index > 0 ? 5 : 0}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo}}>{taxRowLabel(index, letter)}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.turnover} `}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{formatAmt(taxRows[index]?.gross)}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.netSum} `}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{formatAmt(taxRows[index]?.net)}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.tax} `}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{formatAmt(taxRows[index]?.tax)}</Text>
              </View>
            </View>
            </React.Fragment>
            ))}

            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.dottedLine, fontFamily: 'Helvetica-Bold'}}>........................................</Text>
              </View>
            </View>

            <View style={{ ...pdfStyles.tableRow, marginTop: 5}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo}}>{t.totals}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.turnover} `}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{TotalVATIncl.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.netAbc} `}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{TotalNetABC.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.tax} `}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{TotalVAT.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.turnoverExSr} `}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{TotalNetDE.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>
          </Page>
        )
    
        const PDFA4 = () => (
            <Page size="A4" style={pdfStyles.page}>

                <View style={{ ...pdfStyles.tableRow, textAlign: 'center'}}>
                    <View style={{ flex: 1}}> 
                        <Text style={{...pdfStyles.majorInfo, fontFamily: 'Helvetica-Bold'}}>{reportData.name}</Text>
                    </View>
                </View>
        
                <View style={{ ...pdfStyles.tableRow, textAlign: 'center'}}>
                    <View style={{...pdfStyles.minInfo,flex:0.4}}>
                    </View>
                    <View style={{flex:1.5}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold', textAlign: 'right'}}>{t.mobile}</Text>
                    </View>
                    <View style={{flex:2}}>
                        <Text style={{...pdfStyles.minInfo, textAlign: 'left'}}>{organization.phone}</Text>
                    </View>
                </View>
        
                <View style={{ ...pdfStyles.tableRow, textAlign: 'center'}}>
                    <View style={{...pdfStyles.minInfo,flex:0.4}}>
                    </View>
                    <View style={{flex:1.5}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold', textAlign: 'right'}}>TIN:</Text>
                    </View>
                    <View style={{flex:2}}>
                        <Text style={{...pdfStyles.minInfo, textAlign: 'left'}}>{reportData.tin}</Text>
                    </View>
                </View>
        
                <View style={{ ...pdfStyles.tableRow, textAlign: 'center'}}>
                    <View style={{flex:0.4}}>
                    </View>
                    <View style={{flex:1.5}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold', textAlign: 'right'}}>VRN:</Text>
                    </View>
                    <View style={{flex:2}}>
                        <Text style={{...pdfStyles.minInfo, textAlign: 'left'}}>{reportData.vrn}</Text>
                    </View>
                </View>
        
                <View style={{ ...pdfStyles.tableRow, textAlign: 'center'}}>
                    <View style={{flex:0.4}}>
                    </View>
                    <View style={{flex:1.5}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold', textAlign: 'right'}}>{t.serialNumber}</Text>
                    </View>
                    <View style={{flex:2}}>
                        <Text style={{...pdfStyles.minInfo, textAlign: 'left'}}>{organization.tra_serial_number}</Text>
                    </View>
                </View>
        
                <View style={{ ...pdfStyles.tableRow, textAlign: 'center'}}>
                    <View style={{flex:0.2}}>
                    </View>
                    <View style={{flex:0.1}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold', textAlign: 'right'}}>UIN:</Text>
                    </View>
                    <View style={{flex:0.7}}>
                        <Text style={{...pdfStyles.minInfo, textAlign: 'left'}}>{reportData.uin}</Text>
                    </View>
                </View>
        
                <View style={{ ...pdfStyles.tableRow, textAlign: 'center'}}>
                    <View style={{flex:0.2}}>
                    </View>
                    <View style={{flex:0.2}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold', textAlign: 'right'}}>{t.taxOffice}</Text>
                    </View>
                    <View style={{...pdfStyles.minInfo,flex:0.6}}>
                        <Text style={{...pdfStyles.minInfo, textAlign: 'left'}}>{reportData.taxOffice}</Text>
                    </View>
                </View>
        
                <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:0.4}}>
                    </View>
                    <View style={{...pdfStyles.blackLine,flex:1}}>
                    </View>
                    <View style={{flex:0.4}}>
                    </View>
                </View>
        
                <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:1}}>
                    </View> 
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{t.date}</Text>
                        <Text style={{...pdfStyles.minInfo}}>{reportData.date}</Text>
                    </View>
                    <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right'}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{t.time}</Text>
                        <Text style={{...pdfStyles.minInfo}}>{reportData.time}</Text>
                    </View>
                    <View style={{flex:1}}>
                    </View>
                </View>
        
                <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:0.59}}>
                    </View>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.dottedLine, fontFamily: 'Helvetica-Bold'}}>........................................</Text>
                    </View>
                    <View style={{flex:1}}>
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow, ...pdfStyles.textBold, textAlign: 'center'}}>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.minInfo, marginTop: 3, fontFamily: 'Helvetica-Bold'}}>{t.title.toUpperCase()}</Text>
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:0.59}}>
                    </View>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.dottedLine, fontFamily: 'Helvetica-Bold'}}>........................................</Text>
                    </View>
                    <View style={{flex:1}}>
                    </View>
                </View>
        
                <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:1}}>
                    </View>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.discount} `}</Text>
                    </View>
                    <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right'}}>
                        <Text style={{...pdfStyles.minInfo}}>0.00</Text>
                    </View>
                    <View style={{flex:1}}>
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:1}}>
                    </View>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.amount} `}</Text>
                    </View>
                    <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right'}}>
                        <Text style={{...pdfStyles.minInfo}}>0.00</Text>
                    </View>
                    <View style={{flex:1}}>
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:1}}>
                    </View>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.markup} `}</Text>
                    </View>
                    <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right'}}>
                        <Text style={{...pdfStyles.minInfo}}>0.00</Text>
                    </View>
                    <View style={{flex:1}}>
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:1}}>
                    </View>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.amount} `}</Text>
                    </View>
                    <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right'}}>
                        <Text style={{...pdfStyles.minInfo}}>0.00</Text>
                    </View>
                    <View style={{flex:1}}>
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:1}}>
                    </View>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.money} `}</Text>
                    </View>
                    <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right'}}>
                        <Text style={{...pdfStyles.minInfo}}>{TotalVATIncl.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                    </View>
                    <View style={{flex:1}}>
                    </View>
                </View>
        
                <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:0.59}}>
                    </View>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.dottedLine, fontFamily: 'Helvetica-Bold'}}>........................................</Text>
                    </View>
                    <View style={{flex:1}}>
                    </View>
                </View>
        
                <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:1}}>
                    </View>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.firstReceipt} `}</Text>
                    </View>
                    <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right'}}>
                        <Text style={{...pdfStyles.minInfo}}>{reportData.from}</Text>
                    </View>
                    <View style={{flex:1}}>
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:1}}>
                    </View>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.lastReceipt} `}</Text>
                    </View>
                    <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right'}}>
                        <Text style={{...pdfStyles.minInfo}}>{reportData.to}</Text>
                    </View>
                    <View style={{flex:1}}>
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:1}}>
                    </View>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.receiptsIssued} `}</Text>
                    </View>
                    <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right'}}>
                        <Text style={{...pdfStyles.minInfo}}>{(reportData.ticketsFiscal - 0).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                    </View>
                    <View style={{flex:1}}>
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:1}}>
                    </View>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.corrections} `}</Text>
                    </View>
                    <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right'}}>
                        <Text style={{...pdfStyles.minInfo}}>{(reportData.corrections - 0).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                    </View>
                    <View style={{flex:1}}>
                    </View>
                </View>
        
                <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:0.59}}>
                    </View>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.dottedLine, fontFamily: 'Helvetica-Bold'}}>........................................</Text>
                    </View>
                    <View style={{flex:1}}>
                    </View>
                    </View>
                    <View style={{ ...pdfStyles.tableRow, textAlign: 'center'}}>
                    <View style={{ flex: 1, marginTop: 3}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{t.paymentReport}</Text>
                    </View>
                </View> 
                <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:0.59}}>
                    </View>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.dottedLine, fontFamily: 'Helvetica-Bold'}}>........................................</Text>
                    </View>
                    <View style={{flex:1}}>
                    </View>
                </View>
        
                <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:1}}>
                    </View>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.cash} `}</Text>
                    </View>
                    <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right'}}>
                        <Text style={{...pdfStyles.minInfo}}>{TotalVATIncl.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                    </View>
                    <View style={{flex:1}}>
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:1}}>
                    </View>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.total} `}</Text>
                    </View>
                    <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right'}}>
                        <Text style={{...pdfStyles.minInfo}}>{TotalVATIncl.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                    </View>
                    <View style={{flex:1}}>
                    </View>
                </View>
        
                <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:0.59}}>
                    </View>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.dottedLine, fontFamily: 'Helvetica-Bold'}}>........................................</Text>
                    </View>
                    <View style={{flex:1}}>
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow, ...pdfStyles.textBold, textAlign: 'center'}}>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{t.taxReport}</Text>
                    </View>
                    </View> 
                    <View style={{ ...pdfStyles.tableRow}}>
                    <View style={{flex:0.59}}>
                    </View>
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.dottedLine, fontFamily: 'Helvetica-Bold'}}>........................................</Text>
                    </View>
                    <View style={{flex:1}}>
                    </View>
                </View>
        
                {['A','B','C','D','E'].map((letter, index) => (
                <React.Fragment key={letter}>
                <View style={{ ...pdfStyles.tableRow, marginTop: index > 0 ? 5 : 0}}>
                <View style={{flex:0.55}}>
                </View>
                <View style={{ flex: 1}}>
                    <Text style={{...pdfStyles.minInfo}}>{taxRowLabel(index, letter)}</Text>
                </View>
                <View style={{flex:1}}>
                </View>
                </View>
                <View style={{ ...pdfStyles.tableRow}}>
                <View style={{flex:1}}>
                </View>
                <View style={{ flex: 1}}>
                    <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.turnover} `}</Text>
                </View>
                <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                </View>
                <View style={{ flex: 1, textAlign: 'right'}}>
                    <Text style={{...pdfStyles.minInfo}}>{formatAmt(taxRows[index]?.gross)}</Text>
                </View>
                <View style={{flex:1}}>
                </View>
                </View>
                <View style={{ ...pdfStyles.tableRow}}>
                <View style={{flex:1}}>
                </View>
                <View style={{ flex: 1}}>
                    <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.netSum} `}</Text>
                </View>
                <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                </View>
                <View style={{ flex: 1, textAlign: 'right'}}>
                    <Text style={{...pdfStyles.minInfo}}>{formatAmt(taxRows[index]?.net)}</Text>
                </View>
                <View style={{flex:1}}>
                </View>
                </View>
                <View style={{ ...pdfStyles.tableRow}}>
                <View style={{flex:1}}>
                </View>
                <View style={{ flex: 1}}>
                    <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.tax} `}</Text>
                </View>
                <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                </View>
                <View style={{ flex: 1, textAlign: 'right'}}>
                    <Text style={{...pdfStyles.minInfo}}>{formatAmt(taxRows[index]?.tax)}</Text>
                </View>
                <View style={{flex:1}}>
                </View>
                </View>
                </React.Fragment>
                ))}

                <View style={{ ...pdfStyles.tableRow}}>
                <View style={{flex:0.59}}>
                </View>
                <View style={{ flex: 1}}>
                    <Text style={{...pdfStyles.dottedLine, fontFamily: 'Helvetica-Bold'}}>........................................</Text>
                </View>
                <View style={{flex:1}}>
                </View>
                </View>

                <View style={{ ...pdfStyles.tableRow, marginTop: 5}}>
                <View style={{flex:0.55}}>
                </View>
                <View style={{ flex: 1}}>
                    <Text style={{...pdfStyles.minInfo}}>{t.totals}</Text>
                </View>
                <View style={{flex:1}}>
                </View>
                </View>
                <View style={{ ...pdfStyles.tableRow}}>
                <View style={{flex:1}}>
                </View>
                <View style={{ flex: 1}}>
                    <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.turnover} `}</Text>
                </View>
                <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                </View>
                <View style={{ flex: 1, textAlign: 'right'}}>
                    <Text style={{...pdfStyles.minInfo}}>{TotalVATIncl.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                </View>
                <View style={{flex:1}}>
                </View>
                </View>
                <View style={{ ...pdfStyles.tableRow}}>
                <View style={{flex:1}}>
                </View>
                <View style={{ flex: 1}}>
                    <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.netAbc} `}</Text>
                </View>
                <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                </View>
                <View style={{ flex: 1, textAlign: 'right'}}>
                    <Text style={{...pdfStyles.minInfo}}>{TotalNetABC.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                </View>
                <View style={{flex:1}}>
                </View>
                </View>
                <View style={{ ...pdfStyles.tableRow}}>
                <View style={{flex:1}}>
                </View>
                <View style={{ flex: 1}}>
                    <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.tax} `}</Text>
                </View>
                <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                </View>
                <View style={{ flex: 1, textAlign: 'right'}}>
                    <Text style={{...pdfStyles.minInfo}}>{TotalVAT.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                </View>
                <View style={{flex:1}}>
                </View>
                </View>
                <View style={{ ...pdfStyles.tableRow}}>
                <View style={{flex:1}}>
                </View>
                <View style={{ flex: 1}}>
                    <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>{`${t.turnoverExSr} `}</Text>
                </View>
                <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                </View>
                <View style={{ flex: 1, textAlign: 'right'}}>
                    <Text style={{...pdfStyles.minInfo}}>{TotalNetDE.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                </View>
                <View style={{flex:1}}>
                </View>
                </View>
            </Page>
        )
  
    return ( 
      <Document 
        creator={` ${user.name} | Powered By ProsERP` }
        producer='ProsERP'
      >
        { !!thermalPrinter ? <PDF80mm/> : <PDFA4/> }
      </Document>
    )
}

export default ZReportPDF