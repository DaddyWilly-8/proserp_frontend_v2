import {
  Accordion,
  AccordionDetails,
  Typography,
  Box,
  Grid,
} from '@mui/material';
import { ExpandMore, EditOutlined, DeleteOutlined } from '@mui/icons-material';
import React, { useState, useEffect } from 'react';
import { BOMItem } from '../BomType';
import BomItemForm from './BomItemForm';
import AlternativesForm from './alternatives/AlternativesForm';

interface BomItemRowProps {
  key: number;
  index: number;
  item: BOMItem;
  items: BOMItem[];
  setItems: React.Dispatch<React.SetStateAction<BOMItem[]>>;
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  submitItemForm: boolean;
  submitMainForm: (e?: React.BaseSyntheticEvent<object, any, any> | undefined) => Promise<void>;
}

const BomItemRow: React.FC<BomItemRowProps> = ({
  item,
  index,
  items,
  setItems,
  setClearFormKey,
  setSubmitItemForm,
  submitItemForm,
  submitMainForm,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [alternatives, setAlternatives] = useState<BOMItem[]>(item.alternatives || []);
  const [editingAlternativeIndex, setEditingAlternativeIndex] = useState<number | null>(null);

  useEffect(() => {
    setAlternatives(item.alternatives || []);
  }, [item.alternatives]);

  const handleRemove = () => {
    setItems((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>, callback: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, exp) => setExpanded(exp)}
      sx={{
        mb: 1,
        '&.Mui-expanded': { margin: '8px 0' },
      }}
    >
      <Box
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => handleKeyPress(e, () => setExpanded(!expanded))}
        aria-controls={`bom-item-${index}-content`}
        id={`bom-item-${index}-header`}
        sx={{
          minHeight: '48px',
          py: 0,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          bgcolor: 'background.paper',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Grid container alignItems="center" spacing={1} sx={{ width: '100%' }}>
          <Grid size={{ xs: 1 }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                border: '1px solid',
                borderColor: 'grey.500',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 'bold',
                flexShrink: 0,
              }}
            >
              {expanded ? '−' : '+'}
            </Box>
          </Grid>

          <Grid size={11}>
            <Grid container columnSpacing={1}>
              {!isEditing ? (
                <>
                  <Grid size={{ xs: 12, md: 6.5 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.product?.name}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 9, md: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.1 }}>
                      <Typography variant="body2">
                        {item.quantity}{' '}
                        {item.symbol ||
                          item.measurement_unit?.unit_symbol ||
                          item.product?.primary_unit?.unit_symbol ||
                          ''}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 3, md: 3 }} sx={{ textAlign: 'end' }}>
                    <Box
                      component="div"
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      sx={{
                        display: 'flex',
                        gap: 0.5,
                        justifyContent: { xs: 'flex-start', md: 'flex-end' },
                      }}
                    >
                      <Box
                        component="div"
                        role="button"
                        tabIndex={0}
                        aria-label="Edit item"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditing(true);
                        }}
                        onKeyDown={(e) => handleKeyPress(e, () => setIsEditing(true))}
                        sx={{
                          p: 0.5,
                          display: 'inline-flex',
                          cursor: 'pointer',
                        }}
                      >
                        <EditOutlined fontSize="small" />
                      </Box>
                      <Box
                        component="div"
                        role="button"
                        tabIndex={0}
                        aria-label="Delete item"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove();
                        }}
                        onKeyDown={(e) => handleKeyPress(e, () => handleRemove())}
                        sx={{
                          p: 0.5,
                          display: 'inline-flex',
                          cursor: 'pointer',
                          color: 'error.main',
                        }}
                      >
                        <DeleteOutlined fontSize="small" />
                      </Box>
                    </Box>
                  </Grid>
                </>
              ) : (
                <Box sx={{ mb: 2, p: 2 }}>
                  <BomItemForm
                    item={item}
                    index={index}
                    setItems={setItems}
                    items={items}
                    setShowForm={setIsEditing}
                    setClearFormKey={setClearFormKey}
                    submitMainForm={submitMainForm}
                    submitItemForm={submitItemForm}
                    setSubmitItemForm={setSubmitItemForm}
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        </Grid>
        <ExpandMore
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            ml: 1,
          }}
        />
      </Box>

      <AccordionDetails sx={{ pt: 1, pb: 2 }}>
        <AlternativesForm
          item={item}
          alternatives={alternatives}
          setAlternatives={setAlternatives}
          setItems={setItems}
          index={index}
          isEditing={editingAlternativeIndex !== null}
        />
      </AccordionDetails>
    </Accordion>
  );
};

export default BomItemRow;