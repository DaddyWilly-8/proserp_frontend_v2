import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import {
    Divider, Grid, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

function PBSummary({ combinedInputsConsumptions, otherExpenses, by_products, outputs }) {
    const dictionary = useDictionary();
    const theme = useTheme();
    const { authOrganization } = useJumboAuth();

    const mainColor =
        authOrganization.organization.settings?.main_color ||
        theme.palette.primary.main;

    const contrastText =
        authOrganization.organization.settings?.contrast_text ||
        theme.palette.getContrastText(mainColor);

    const lightColor =
        theme.type === "dark"
            ? theme.palette.action.hover
            : authOrganization.organization.settings?.light_color ||
              theme.palette.action.selected;

    const totalCombinedInputs = combinedInputsConsumptions?.reduce(
        (total, item) => total + ((item.unit_cost || item.rate) * item.quantity || 0),
        0
    );

    const totalOtherExpenses = otherExpenses?.reduce(
        (total, item) => total + (item.quantity * item.rate || 0),
        0
    );

    const totalByProducts = by_products?.reduce(
        (total, item) => total + (item.quantity * item.market_value || 0),
        0
    );

    const combinedInputsOtherExpensesByProduct =
        (totalCombinedInputs + totalOtherExpenses) - totalByProducts;

    return (
        <Grid container spacing={1}>
            <Grid size={12}><Divider /></Grid>

            {/* ----- INVENTORY CONSUMPTIONS ----- */}
            {combinedInputsConsumptions.length > 0 && (
                <Grid size={12}>
                    <Typography variant="h3" color={mainColor} align="center" marginTop={5}>
                        {dictionary.forms.batches.summary.inventoryConsumptions}
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>{dictionary.forms.batches.summary.sn}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>{dictionary.forms.batches.summary.date}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>{dictionary.forms.batches.summary.consumptionNo}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>{dictionary.forms.batches.labels.product}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>{dictionary.forms.batches.labels.quantity}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>{dictionary.forms.batches.summary.averageCost}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>{dictionary.forms.batches.labels.amount}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>{dictionary.forms.batches.summary.description}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {combinedInputsConsumptions?.map((item, index) => (
                                    <TableRow
                                        key={index}
                                        sx={{ backgroundColor: index % 2 === 0 ? theme.palette.background.paper : lightColor }}
                                    >
                                        <TableCell>{index + 1}.</TableCell>
                                        <TableCell>{readableDate(item.consumption_date)}</TableCell>
                                        <TableCell>{item.consumptionNo}</TableCell>
                                        <TableCell>{item.product.name}</TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>
                                            {item.quantity?.toLocaleString()} {item?.unit_symbol ? item.unit_symbol : (item.measurement_unit?.symbol ? item.measurement_unit?.symbol : item.product?.unit_symbol)}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>
                                            {(item.unit_cost || item.rate)?.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) || 0}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>
                                            {((item.unit_cost || item.rate) * item.quantity || 0)?.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell>{item.description || item.remarks}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow sx={{ backgroundColor: mainColor }}>
                                    <TableCell colSpan={6} align="center" sx={{ fontWeight: 'bold', color: contrastText }}>
                                        {dictionary.forms.batches.summary.totalAmount}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: contrastText, textAlign: 'right' }}>
                                        {totalCombinedInputs?.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            )}

            {/* ----- OTHER EXPENSES ----- */}
            {otherExpenses.length > 0 && (
                <Grid size={12}>
                    <Typography variant="h3" color={mainColor} align="center" marginTop={5}>
                        {dictionary.forms.batches.summary.otherExpenses}
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>{dictionary.forms.batches.summary.sn}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>{dictionary.forms.batches.summary.expenseName}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>{dictionary.forms.batches.labels.quantity}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>{dictionary.forms.batches.labels.rate}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>{dictionary.forms.batches.labels.amount}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {otherExpenses?.map((item, index) => (
                                    <TableRow
                                        key={index}
                                        sx={{ backgroundColor: index % 2 === 0 ? theme.palette.background.paper : lightColor }}
                                    >
                                        <TableCell>{index + 1}.</TableCell>
                                        <TableCell>{item.ledger?.name}</TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>{item.quantity?.toLocaleString()}</TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>{item.rate?.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>
                                            {(item.quantity * item.rate)?.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow sx={{ backgroundColor: mainColor }}>
                                    <TableCell colSpan={4} align="center" sx={{ fontWeight: 'bold', color: contrastText }}>
                                        {dictionary.forms.batches.summary.totalAmount}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: contrastText, textAlign: 'right' }}>
                                        {totalOtherExpenses?.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            )}

            {/* ----- BY PRODUCTS ----- */}
            {by_products.length > 0 && (
                <Grid size={12}>
                    <Typography variant="h3" color={mainColor} align="center" marginTop={5}>
                        {dictionary.forms.batches.summary.byProducts}
                    </Typography>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>{dictionary.forms.batches.summary.sn}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>{dictionary.forms.batches.labels.product}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>{dictionary.forms.batches.labels.store}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>{dictionary.forms.batches.labels.quantity}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>{dictionary.forms.batches.labels.marketValue}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>{dictionary.forms.batches.labels.amount}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>{dictionary.forms.batches.labels.remarks}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {by_products?.map((item, index) => (
                                    <TableRow
                                        key={index}
                                        sx={{ backgroundColor: index % 2 === 0 ? theme.palette.background.paper : lightColor }}
                                    >
                                        <TableCell>{index + 1}.</TableCell>
                                        <TableCell>{item.product.name}</TableCell>
                                        <TableCell>{item.store?.name}</TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>
                                            {item.quantity?.toLocaleString()} {item?.unit_symbol ? item.unit_symbol : (item.measurement_unit?.symbol ? item.measurement_unit?.symbol : item.product?.unit_symbol)}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>
                                            {item.market_value?.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>
                                            {(item.quantity * item.market_value)?.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell>{item.description || item.remarks}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow sx={{ backgroundColor: mainColor }}>
                                    <TableCell colSpan={5} align="center" sx={{ fontWeight: 'bold', color: contrastText }}>
                                        {dictionary.forms.batches.summary.totalAmount}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: contrastText, textAlign: 'right' }}>
                                        {totalByProducts?.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            )}

            {/* ----- OUTPUTS ----- */}
            {outputs.length > 0 && (
                <Grid size={12}>
                    <Typography variant="h3" color={mainColor} align="center" marginTop={5}>
                        {dictionary.forms.batches.summary.outputs}
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>{dictionary.forms.batches.summary.sn}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>{dictionary.forms.batches.labels.product}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>{dictionary.forms.batches.labels.quantity}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>{dictionary.forms.batches.summary.unitCost}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>{dictionary.forms.batches.labels.amount}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>{dictionary.forms.batches.summary.valuePercent}</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>{dictionary.forms.batches.labels.remarks}</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {outputs?.map((item, index) => (
                                    <TableRow
                                        key={index}
                                        sx={{ backgroundColor: index % 2 === 0 ? theme.palette.background.paper : lightColor }}
                                    >
                                        <TableCell>{index + 1}.</TableCell>
                                        <TableCell>{item.product.name}</TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>
                                            {item.quantity?.toLocaleString()} {item?.unit_symbol ? item.unit_symbol : (item.measurement_unit?.symbol ? item.measurement_unit?.symbol : item.product?.unit_symbol)}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>
                                            {(((item.value_percentage / 100) * combinedInputsOtherExpensesByProduct) / item.quantity)?.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>
                                            {((item.value_percentage / 100) * combinedInputsOtherExpensesByProduct)?.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>{item.value_percentage}%</TableCell>
                                        <TableCell>{item.description || item.remarks}</TableCell>
                                    </TableRow>
                                ))}

                                <TableRow sx={{ backgroundColor: mainColor }}>
                                    <TableCell colSpan={4} align="center" sx={{ color: contrastText, fontWeight: 'bold' }}>
                                        {dictionary.forms.batches.summary.totalAmount}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: contrastText, textAlign: 'right' }}>
                                        {outputs?.reduce(
                                            (sum, item) => sum + ((item.value_percentage / 100) * combinedInputsOtherExpensesByProduct),
                                            0
                                        )?.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell sx={{ color: contrastText }}></TableCell>
                                    <TableCell sx={{ color: contrastText }}></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            )}
        </Grid>
    );
}

export default PBSummary;
