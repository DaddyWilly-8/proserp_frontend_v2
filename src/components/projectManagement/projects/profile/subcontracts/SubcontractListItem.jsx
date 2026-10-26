import { Accordion, AccordionSummary, AccordionDetails, Grid, ListItemText, Tooltip, Typography, Tabs, Tab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import React, { useState } from 'react';
import SubcontractItemAction from './SubcontractItemAction';
import SubContractTaskTab from './tabs/tasks/SubContractTaskTab';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';
import SubContractMaterialIssuedTab from './tabs/materialIssued/SubContractMaterialIssuedTab';
import CertificatesTab from './tabs/certificatesTab/CertificatesTab';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function SubcontractListItem({ subContract }) {
    const dictionary = useDictionary();
    const [expanded, setExpanded] = useState({});
    const [activeTab, setActiveTab] = useState(0);

    const handleChange = (id) => {
        setExpanded((prevExpanded) => ({
          ...prevExpanded,
          [id]: !prevExpanded[id],
        }));
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <Accordion
            key={subContract.id}
            expanded={!!expanded[subContract.id]}
            onChange={() => handleChange(subContract.id)}
            square
            sx={{
                borderRadius: 2,
                borderTop: 2,
                padding: 0.5,
                borderColor: 'divider',
                '&:hover': {
                    bgcolor: 'action.hover',
                },
                '& > .MuiAccordionDetails-root:hover': {
                    bgcolor: 'transparent',
                },
            }}
        >
            <AccordionSummary
                expandIcon={expanded[subContract.id] ? <RemoveIcon /> : <AddIcon />}
                sx={{
                    px: 3,
                    flexDirection: 'row-reverse',
                    '.MuiAccordionSummary-content': {
                      alignItems: 'center',
                      '&.Mui-expanded': {
                        margin: '12px 0',
                      },
                    },
                    '.MuiAccordionSummary-expandIconWrapper': {
                      borderRadius: 1,
                      border: 1,
                      color: 'text.secondary',
                      transform: 'none',
                      mr: 1,
                      '&.Mui-expanded': {
                        transform: 'none',
                        color: 'primary.main',
                        borderColor: 'primary.main',
                      },
                      '& svg': {
                        fontSize: '1.25rem',
                      },
                    },
                }}
            >
                <Grid container width={'100%'} alignItems={'center'} columnSpacing={2}>
                    <Grid size={{xs: 12, md: 6, lg: 3}}>
                        <ListItemText
                            primary={
                                <Tooltip title={dictionary.tooltips.subContractor}>
                                    <Typography component="span">
                                        {subContract.subcontractor?.name}
                                    </Typography>
                                </Tooltip>
                            }
                            secondary={
                                <Tooltip title={dictionary.tooltips.contractNo}>
                                    <Typography component="span">
                                        {subContract.subcontractNo}
                                    </Typography>
                                </Tooltip>
                            }
                        />
                    </Grid>
                    <Grid size={{xs: 12, md: 6, lg: 3}}>
                        <Tooltip title={dictionary.tooltips.contractPeriod}>
                            <Typography component="span" fontSize={14} lineHeight={1.5} noWrap>
                                {`${subContract.commencement_date ? readableDate(subContract.commencement_date,false) : ''} ${subContract.completion_date ? '→ ' + readableDate(subContract.completion_date,false) : ''}`}
                            </Typography>
                        </Tooltip>
                    </Grid>
                    <Grid size={{xs: 12, md: 6, lg: 3.5}}>
                        <ListItemText
                            primary={
                                <Tooltip title={dictionary.tooltips.reference}>
                                    <Typography component="span">
                                        {subContract.reference}
                                    </Typography>
                                </Tooltip>
                            }
                            secondary={
                                <Tooltip title={dictionary.tooltips.remarks}>
                                    <Typography component="span">
                                        {subContract.remarks}
                                    </Typography>
                                </Tooltip>
                            }
                        />
                    </Grid>
                    <Grid size={{xs: 6, md: 5, lg: 2}}>
                        <Tooltip title={dictionary.tooltips.amount}>
                            <Typography variant="h6">
                                {subContract?.contract_sum?.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: subContract.currency?.code,
                                })}
                            </Typography>
                        </Tooltip>
                    </Grid>
                    <Grid size={{xs: 6, md: 1, lg: 0.5}} textAlign="end">
                        <SubcontractItemAction subContract={subContract} />
                    </Grid>
                </Grid>
            </AccordionSummary>

            <AccordionDetails
                sx={{
                    backgroundColor: 'background.paper',
                    marginBottom: 3,
                    padding: 0.5,
                }}
                >
                <Grid container spacing={2}>
                    <Grid size={{xs: 12}}>
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            allowScrollButtonsMobile
                            sx={{ display: 'flex', justifyContent: 'center' }}
                        >
                            <Tab label={dictionary.projectManagement.subcontracts.tabs.tasks} />
                            <Tab label={dictionary.projectManagement.subcontracts.tabs.certificates} />
                            <Tab label={dictionary.projectManagement.subcontracts.tabs.materialUsed} />
                            <Tab label={dictionary.projectManagement.common.attachments} />
                        </Tabs>
                    </Grid>
                </Grid>

                <Grid container width={'100%'}>
                    {activeTab === 0 && (
                        <SubContractTaskTab  isExpanded={expanded[subContract.id]} subContract={subContract}/>
                    )}
                    {activeTab === 1 && (
                        <CertificatesTab  isExpanded={expanded[subContract.id]} subContract={subContract}/>
                    )}
                    {activeTab === 2 && (
                        <SubContractMaterialIssuedTab  isExpanded={expanded[subContract.id]} subContract={subContract}/>
                    )}
                    {activeTab === 3 && (
                        <Grid container width={'100%'} columnSpacing={1} justifyContent="center" marginTop={1}>
                            <Grid size={{xs: 12}}>
                                <AttachmentForm
                                    hideFeatures={true}
                                    attachment_sourceNo={subContract.subcontractNo}
                                    attachmentable_type={'project_subcontract'}
                                    attachmentable_id={subContract.id}
                                />
                            </Grid>
                        </Grid>
                    )}
                </Grid>
            </AccordionDetails>
        </Accordion>
    );
}

export default SubcontractListItem;