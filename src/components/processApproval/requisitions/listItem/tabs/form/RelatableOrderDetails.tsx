import { Button, DialogActions, DialogContent } from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import PurchaseOrderOnScreenPreview from '@/components/procurement/purchases/PurchaseOrderOnScreenPreview';

interface RelatableOrderDetailsProps {
    order: any;
    toggleOpen: (open: boolean) => void;
}

function RelatableOrderDetails({ order, toggleOpen }: RelatableOrderDetailsProps) {
    const dictionary = useDictionary();
    return (
        <>
            <DialogContent>
                <PurchaseOrderOnScreenPreview order={order} />
            </DialogContent>
            <DialogActions>
                <Button size="small" variant='outlined' onClick={() => toggleOpen(false)}>
                    {dictionary.forms.requisitions.common.close}
                </Button>
            </DialogActions>
        </>
    );
}

export default RelatableOrderDetails;
