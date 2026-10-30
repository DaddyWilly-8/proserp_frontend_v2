'use client';

import { ASSET_IMAGES } from '@/utilities/constants/paths';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import { Card, CardContent, Link, Typography } from '@mui/material';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const VerifyPassword = () => {
  const dictionary = useDictionary();
  const router = useRouter();
  const params = useParams<{ lang?: string }>();
  const searchParams = useSearchParams();
  const lang = params?.lang || 'en-US';
  const signature = (searchParams.get('signature') || '').trim();

  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (signature) {
      console.log('signature: ', signature);
      setIsVerifying(true);
    } else {
      setIsVerifying(false);
    }
  }, [signature]);

  return (
    <Div
      sx={{
        flex: 1,
        flexWrap: 'wrap',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: (theme) => theme.spacing(4),
      }}
    >
      <Div sx={{ mb: 3, display: 'inline-flex' }}>
        <img
          width={200}
          src={`${ASSET_IMAGES}/logos/proserp-blue.png`}
          alt='ProsERP'
        />
      </Div>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent>
          <LoadingButton
            // onClick={handleSubmit}
            loading={isVerifying}
            fullWidth
            variant='contained'
            size='large'
            sx={{ mb: 3 }}
          >
            {isVerifying ? dictionary.forms.verifyPassword.verifying : dictionary.forms.verifyPassword.verify}
          </LoadingButton>

          <Typography align='center' variant='body2' mb={1}>
            {dictionary.forms.verifyPassword.havePassword}{' '}
            <Link
              href='/auth/signin'
              style={{ color: '#0267a0', fontWeight: 600 }}
            >
              {dictionary.forms.verifyPassword.proceedToSignIn}
            </Link>
          </Typography>

          <Typography align='center' variant='body2'>
            {dictionary.forms.verifyPassword.forgotEmail}{' '}
            <Link href='/support' style={{ color: '#00a8ff' }}>
              {dictionary.forms.verifyPassword.contactSupport}
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Div>
  );
};

export default VerifyPassword;
