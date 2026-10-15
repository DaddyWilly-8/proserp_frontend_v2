import pdfStyles from '@/components/pdf/pdf-styles';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import React from 'react'

function ZReportPDF({reportData, authOrganization, user, thermalPrinter}) {
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
    const taxRowLabel = (index, fallback) => taxRows[index]?.text ? `TAX ${taxRows[index].text}%` : fallback;

    const PDF80mm = () => (
        <Page size={[80 * 2.83465, 297 * 2.83465]}  style={{...pdfStyles.page, padding: 10, scale: 0.7 }}>
    
            <View style={{ ...pdfStyles.tableRow, textAlign: 'center'}}>
              <View style={{ flex: 1}}> 
                <Text style={{...pdfStyles.midInfo, fontFamily: 'Helvetica-Bold'}}>{reportData.name}</Text>
              </View>
            </View>
    
            <View style={{ ...pdfStyles.tableRow, textAlign: 'center'}}>
              <View style={{flex:0.4}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold', textAlign: 'right'}}>MOBILE:</Text>
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
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold', textAlign: 'right'}}>SERIAL NUMBER:</Text>
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
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold', textAlign: 'right'}}>TAX OFFICE:</Text>
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
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>DATE</Text>
                <Text style={{...pdfStyles.minInfo}}>{reportData.date}</Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>TIME</Text>
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
                <Text style={{...pdfStyles.minInfo, marginTop: 3, fontFamily: 'Helvetica-Bold'}}>Z REPORT</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.dottedLine, fontFamily: 'Helvetica-Bold'}}>........................................</Text>
              </View>
            </View>
    
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>DISCOUNT: </Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>0.00</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>AMOUNT: </Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>0.00</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>MARKUP: </Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>0.00</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>AMOUNT: </Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>0.00</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>MONEY: </Text>
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
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>FIRST RECEIPT: </Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{reportData.from}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>LAST RECEIPT: </Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{reportData.to}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>RECEIPTS ISSUED: </Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{(reportData.ticketsFiscal - 0).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>CORRECTIONS: </Text>
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
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>PAYMENT REPORT</Text>
              </View>
            </View> 
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.dottedLine, fontFamily: 'Helvetica-Bold'}}>........................................</Text>
              </View>
            </View>
    
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>CASH: </Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{TotalVATIncl.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>TOTAL: </Text>
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
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>TAX REPORT</Text>
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
                <Text style={{...pdfStyles.minInfo}}>{taxRowLabel(index, `TAX ${letter} - 0.00%`)}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>TURNOVER: </Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{formatAmt(taxRows[index]?.gross)}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>NET SUM: </Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{formatAmt(taxRows[index]?.net)}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>TAX: </Text>
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
                <Text style={{...pdfStyles.minInfo}}>TOTALS:</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>TURNOVER: </Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{TotalVATIncl.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>NET (A+B+C): </Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{TotalNetABC.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>TAX: </Text>
              </View>
              <View style={{...pdfStyles.minInfo,flex: 0.5}}>
              </View>
              <View style={{ flex: 1, textAlign: 'right'}}>
                <Text style={{...pdfStyles.minInfo}}>{TotalVAT.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
              <View style={{ flex: 1}}>
                <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>TURNOVER(EX+SR): </Text>
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
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold', textAlign: 'right'}}>MOBILE:</Text>
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
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold', textAlign: 'right'}}>SERIAL NUMBER:</Text>
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
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold', textAlign: 'right'}}>TAX OFFICE:</Text>
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
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>DATE</Text>
                        <Text style={{...pdfStyles.minInfo}}>{reportData.date}</Text>
                    </View>
                    <View style={{...pdfStyles.minInfo,flex: 0.5}}>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right'}}>
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>TIME</Text>
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
                        <Text style={{...pdfStyles.minInfo, marginTop: 3, fontFamily: 'Helvetica-Bold'}}>Z REPORT</Text>
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
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>DISCOUNT: </Text>
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
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>AMOUNT: </Text>
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
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>MARKUP: </Text>
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
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>AMOUNT: </Text>
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
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>MONEY: </Text>
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
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>FIRST RECEIPT: </Text>
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
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>LAST RECEIPT: </Text>
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
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>RECEIPTS ISSUED: </Text>
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
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>CORRECTIONS: </Text>
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
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>PAYMENT REPORT</Text>
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
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>CASH: </Text>
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
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>TOTAL: </Text>
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
                        <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>TAX REPORT</Text>
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
                    <Text style={{...pdfStyles.minInfo}}>{taxRowLabel(index, `TAX ${letter} - 0.00%`)}</Text>
                </View>
                <View style={{flex:1}}>
                </View>
                </View>
                <View style={{ ...pdfStyles.tableRow}}>
                <View style={{flex:1}}>
                </View>
                <View style={{ flex: 1}}>
                    <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>TURNOVER: </Text>
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
                    <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>NET SUM: </Text>
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
                    <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>TAX: </Text>
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
                    <Text style={{...pdfStyles.minInfo}}>TOTALS:</Text>
                </View>
                <View style={{flex:1}}>
                </View>
                </View>
                <View style={{ ...pdfStyles.tableRow}}>
                <View style={{flex:1}}>
                </View>
                <View style={{ flex: 1}}>
                    <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>TURNOVER: </Text>
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
                    <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>NET (A+B+C): </Text>
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
                    <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>TAX: </Text>
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
                    <Text style={{...pdfStyles.minInfo, fontFamily: 'Helvetica-Bold'}}>TURNOVER(EX+SR): </Text>
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