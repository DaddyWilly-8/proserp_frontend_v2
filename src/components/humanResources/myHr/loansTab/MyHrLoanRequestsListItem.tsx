import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { getLoanApprovalDecision } from '@/components/humanResources/loanRequests/loanApprovalUtils';
import LoanRequestPDF from '@/components/humanResources/loanRequests/LoanRequestPDF';
import LoanRequestPreview from '@/components/humanResources/loanRequests/LoanRequestPreview';
import LoanStatement from '@/components/humanResources/loanRequests/LoanStatement';
import LoanStatementPDF from '@/components/humanResources/loanRequests/LoanStatementPDF';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  EditOutlined,
  PreviewOutlined,
  PrintOutlined,
  ReceiptLongOutlined,
  Verified,
} from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';
import LoanRequstForm from './LoanRequstForm';
import { MyHrLoanRequestType } from './LoanRequestType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const formatCurrency = (value?: number | null) =>
  value != null ? Number(value).toLocaleString() : '—';

const STATUS_COLOR: Record<string, any> = {
  in_review: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
  'on hold': 'info',
};

const STATUS_LABEL_KEY: Record<string, string> = {
  in_review: 'inReview',
  approved: 'approved',
  rejected: 'rejected',
  cancelled: 'cancelled',
  'on hold': 'onHold',
};

// Same small label/value tile the HR-side Summary tab uses — duplicated
// locally rather than imported since it isn't exported from that component.
const Field = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => (
  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
    <Card
      variant='outlined'
      elevation={0}
      sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}
    >
      <Typography variant='caption' color='text.secondary' display='block'>
        {label}
      </Typography>
      <Typography variant='h6' fontWeight={500}>
        {value ?? '—'}
      </Typography>
    </Card>
  </Grid>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Grid size={{ xs: 12 }}>
    <Typography variant='subtitle1' fontWeight={600} mt={1.5} mb={0.5}>
      {children}
    </Typography>
  </Grid>
);

const MyHrLoanRequestsListItem = ({
  loanRequest,
}: {
  loanRequest: MyHrLoanRequestType;
}) => {
  const dictionary = useDictionary();
  const t = dictionary.humanResources.myHr.loans.item;
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { authUser, authOrganization } = useJumboAuth() as any;
  const organization = authOrganization?.organization;
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [openStatement, setOpenStatement] = useState(false);
  const [showStatementOnScreen, setShowStatementOnScreen] = useState(true);
  const [openPrint, setOpenPrint] = useState(false);

  const { data: statementData } = useQuery({
    queryKey: ['myHrLoanStatement', loanRequest.id],
    queryFn: () => humanResourcesServices.myHrLoanStatement(loanRequest.id),
    enabled: openStatement,
  });

  const statusColor = STATUS_COLOR[loanRequest.status] || 'default';
  // status_label is backend-computed — "Waiting for {Role}" while a chain-driven
  // request sits at a pending level, same convention as Requisitions.
  const statusLabel =
    loanRequest.status_label ||
    (STATUS_LABEL_KEY[loanRequest.status]
      ? (t.statuses as Record<string, string>)[STATUS_LABEL_KEY[loanRequest.status]]
      : undefined) ||
    loanRequest.status ||
    t.statuses.pending;

  const hasDecision =
    loanRequest.amount_approved != null ||
    loanRequest.installments_approved != null;

  const approvals = loanRequest.approvals || [];

  // Only the creator can edit their own request, and only before anyone has
  // acted on it — mirrors the admin-side list's canEdit and the backend's
  // update() guards.
  const canEdit =
    loanRequest.status === 'in_review' &&
    loanRequest.created_by === Number(authUser?.user?.id);

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      square
      sx={{
        borderRadius: 2,
        borderTop: 2,
        borderColor: 'divider',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <AccordionSummary
        expandIcon={expanded ? <RemoveIcon /> : <AddIcon />}
        sx={{
          px: 2,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': { margin: '10px 0' },
          },
          '.MuiAccordionSummary-expandIconWrapper': {
            borderRadius: 1,
            border: 1,
            color: 'text.secondary',
            transform: 'none',
            mr: 0.5,
            '&.Mui-expanded': {
              transform: 'none',
              color: 'primary.main',
              borderColor: 'primary.main',
            },
            '& svg': { fontSize: '0.9rem' },
          },
        }}
      >
        <Grid
          container
          spacing={1}
          alignItems='center'
          width='100%'
          paddingLeft={1}
          paddingRight={1}
        >
          <Grid size={{ xs: 12, md: 2.8 }}>
            <Tooltip title={dictionary.tooltips.requestedAmount}>
              <Typography>{formatCurrency(loanRequest.amount)}</Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 2.2 }}>
            <Tooltip title={dictionary.tooltips.requestedInstallments}>
              <Typography>{loanRequest.installments} months</Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 2.8 }}>
            <Tooltip title={dictionary.tooltips.approvedAmountInstallments}>
              <Typography>
                {hasDecision
                  ? `${formatCurrency(loanRequest.amount_approved)} / ${loanRequest.installments_approved} mo`
                  : '—'}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 1.9 }}>
            <Tooltip title={dictionary.tooltips.loanRequestDate}>
              <Typography>
                {readableDate(
                  loanRequest.requested_at || loanRequest.created_at,
                  false
                )}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 2.3 }} textAlign={{ md: 'right' }}>
            <Stack
              direction='row'
              spacing={0.5}
              alignItems='center'
              justifyContent={{ md: 'end' }}
              width='100%'
            >
              <Chip
                label={statusLabel}
                size='small'
                color={statusColor}
                variant='outlined'
                sx={{ textTransform: 'capitalize' }}
              />
              {loanRequest.disbursed_at && (
                <Tooltip
                  title={t.disbursedOn.replace(
                    '{date}',
                    readableDate(loanRequest.disbursed_at, false)
                  )}
                >
                  <Verified color='success' fontSize='small' />
                </Tooltip>
              )}
            </Stack>
          </Grid>
        </Grid>
      </AccordionSummary>

      <AccordionDetails sx={{ backgroundColor: 'background.paper', mb: 3 }}>
        <Dialog
          open={openEditDialog}
          fullWidth
          maxWidth='md'
          fullScreen={belowLargeScreen}
          onClose={() => setOpenEditDialog(false)}
        >
          <LoanRequstForm setOpenDialog={setOpenEditDialog} loan={loanRequest} />
        </Dialog>

        <Dialog
          open={openPreview}
          fullWidth
          maxWidth='sm'
          fullScreen={belowLargeScreen}
          scroll={belowLargeScreen ? 'body' : 'paper'}
          onClose={() => setOpenPreview(false)}
        >
          <DialogContent>
            <LoanRequestPreview loanRequest={loanRequest} title={t.yourLoanRequest} />
          </DialogContent>
          <DialogActions>
            <Button size='small' onClick={() => setOpenPreview(false)}>
              {t.close}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openStatement}
          fullWidth
          maxWidth='md'
          fullScreen={belowLargeScreen}
          scroll={belowLargeScreen ? 'body' : 'paper'}
          onClose={() => setOpenStatement(false)}
        >
          <DialogTitle>
            <Stack direction='row' justifyContent='flex-end' alignItems='center'>
              <FileExportGrid
                exportPdf
                handlePdf={() => setShowStatementOnScreen((prev) => !prev)}
              />
            </Stack>
          </DialogTitle>
          <DialogContent>
            {openStatement && showStatementOnScreen && (
              <LoanStatement
                loanId={loanRequest.id}
                service={humanResourcesServices.myHrLoanStatement}
              />
            )}
            {openStatement && !showStatementOnScreen && statementData && (
              <PDFContent
                document={
                  <LoanStatementPDF
                    data={statementData}
                    dictionary={dictionary}
                    organization={organization}
                    userName={authUser?.user?.name || 'ProsERP'}
                  />
                }
                fileName={`Loan Statement - ${
                  statementData.loan?.employee_name || `Employee ${loanRequest.employee_id}`
                }`}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button size='small' onClick={() => setOpenStatement(false)}>
              {t.close}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openPrint} onClose={() => setOpenPrint(false)} maxWidth='md' fullWidth>
          <DialogContent sx={{ height: '80vh', p: 0 }}>
            {openPrint && (
              <PDFContent
                document={
                  <LoanRequestPDF
                    data={loanRequest as any}
                    dictionary={dictionary}
                    organization={organization}
                    userName={authUser?.user?.name || 'ProsERP'}
                    employeeName={authUser?.user?.name}
                  />
                }
                fileName={`Loan Application - ${authUser?.user?.name || 'Employee'}`}
              />
            )}
          </DialogContent>
        </Dialog>

        <Grid container spacing={1}>
          <Grid size={{ xs: 12 }} textAlign='end'>
            <Tooltip title={dictionary.tooltips.printLoanApplicationForm}>
              <IconButton size='small' onClick={() => setOpenPrint(true)}>
                <PrintOutlined color='primary' />
              </IconButton>
            </Tooltip>
            <Tooltip title={dictionary.tooltips.preview}>
              <IconButton size='small' onClick={() => setOpenPreview(true)}>
                <PreviewOutlined color='primary' />
              </IconButton>
            </Tooltip>
            {loanRequest.status === 'approved' && (
              <Tooltip title={dictionary.tooltips.statement}>
                <IconButton
                  size='small'
                  onClick={() => setOpenStatement(true)}
                >
                  <ReceiptLongOutlined color='primary' />
                </IconButton>
              </Tooltip>
            )}
            {canEdit && (
              <Tooltip title={dictionary.tooltips.edit}>
                <IconButton
                  size='small'
                  onClick={() => setOpenEditDialog(true)}
                >
                  <EditOutlined color='primary' />
                </IconButton>
              </Tooltip>
            )}
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant='scrollable'
              scrollButtons='auto'
              allowScrollButtonsMobile
              sx={{ display: 'flex', justifyContent: 'center' }}
            >
              <Tab label={t.tabs.summary} />
              <Tab label={t.tabs.approvals} />
            </Tabs>
          </Grid>
        </Grid>

        {/* ================= SUMMARY TAB ================= */}
        {activeTab === 0 && (
          <Grid container spacing={1} marginTop={0.5}>
            <Card sx={{ width: '100%' }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <SectionTitle>{t.sections.loanDetails}</SectionTitle>
                  </Grid>
                  <Field
                    label={t.fields.department}
                    value={loanRequest.department?.name}
                  />
                  <Field
                    label={t.fields.amountRequested}
                    value={formatCurrency(loanRequest.amount)}
                  />
                  <Field
                    label={t.fields.installmentsRequested}
                    value={t.monthsCount.replace(
                      '{count}',
                      String(loanRequest.installments)
                    )}
                  />
                  <Field label={t.fields.reason} value={loanRequest.reason} />
                </Grid>
              </CardContent>
            </Card>
            <Card sx={{ width: '100%' }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <SectionTitle>{t.sections.approvalDecision}</SectionTitle>
                  </Grid>
                  <Field
                    label={t.fields.status}
                    value={
                      <Chip
                        label={statusLabel}
                        size='small'
                        color={statusColor}
                        variant='outlined'
                        sx={{ textTransform: 'capitalize' }}
                      />
                    }
                  />
                  <Field
                    label={t.fields.amountApproved}
                    value={formatCurrency(loanRequest.amount_approved)}
                  />
                  <Field
                    label={t.fields.installmentsApproved}
                    value={
                      loanRequest.installments_approved != null
                        ? t.monthsCount.replace(
                            '{count}',
                            String(loanRequest.installments_approved)
                          )
                        : undefined
                    }
                  />
                  <Field
                    label={t.fields.installmentAmount}
                    value={formatCurrency(loanRequest.installment_amount)}
                  />
                  <Field
                    label={t.fields.reviewedAt}
                    value={
                      loanRequest.reviewed_at
                        ? readableDate(loanRequest.reviewed_at, false)
                        : undefined
                    }
                  />
                  <Field
                    label={t.fields.reviewRemarks}
                    value={loanRequest.review_remarks}
                  />
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ width: '100%' }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <SectionTitle>{t.sections.disbursementPayment}</SectionTitle>
                  </Grid>
                  <Field
                    label={t.fields.disbursedAt}
                    value={
                      loanRequest.disbursed_at
                        ? readableDate(loanRequest.disbursed_at, false)
                        : undefined
                    }
                  />
                  <Field
                    label={t.fields.disbursedBy}
                    value={
                      loanRequest.disbursed_by
                        ? `${loanRequest.disbursed_by.name}`
                        : undefined
                    }
                  />
                  <Field
                    label={t.fields.disbursementReference}
                    value={loanRequest.disbursement_reference}
                  />
                  <Field
                    label={t.fields.paymentVoucher}
                    value={loanRequest.payment?.voucherNo}
                  />
                  <Grid size={{ xs: 12, sm: 6, md: 8, lg: 9 }}>
                    <Card
                      variant='outlined'
                      elevation={0}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        p: 2,
                      }}
                    >
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        display='block'
                      >
                        {t.fields.paymentNarration}
                      </Typography>
                      <Typography variant='body2' fontWeight={500}>
                        {loanRequest.payment?.narration ?? '-'}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* ================= APPROVALS TAB ================= */}
        {activeTab === 1 && (
          <Grid
            container
            spacing={1}
            justifyContent='center'
            width='100%'
            marginTop={1}
          >
            <Grid size={{ xs: 12 }}>
              <Grid container spacing={2}>
                {approvals.length > 0 ? (
                  approvals.map((approval: any, index: number) => {
                    const decision = getLoanApprovalDecision(approval);
                    const chipColor =
                      decision === 'rejected'
                        ? 'error'
                        : decision === 'on hold'
                          ? 'warning'
                          : decision === 'approved'
                            ? 'success'
                            : 'info';

                    return (
                      <Grid
                        key={approval.id || index}
                        size={{ xs: 12 }}
                        sx={{
                          borderTop: 1,
                          borderColor: 'divider',
                          padding: 1,
                        }}
                        container
                        spacing={2}
                        width='100%'
                        alignItems='center'
                      >
                        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                          <Tooltip title={dictionary.tooltips.actionDate}>
                            <Typography variant='h6'>
                              {approval.approval_date
                                ? readableDate(approval.approval_date)
                                : ''}
                            </Typography>
                          </Tooltip>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                          <Tooltip title={dictionary.tooltips.doneBy}>
                            <Typography variant='h6'>
                              {approval.creator?.name || ''}
                            </Typography>
                          </Tooltip>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                          <Chip
                            size='small'
                            label={approval.status || t.statuses.pending}
                            color={chipColor as any}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </Grid>
                      </Grid>
                    );
                  })
                ) : (
                  <Grid size={{ xs: 12 }}>
                    <Alert variant='outlined' severity='info'>
                      {t.noApprovals}
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default MyHrLoanRequestsListItem;
