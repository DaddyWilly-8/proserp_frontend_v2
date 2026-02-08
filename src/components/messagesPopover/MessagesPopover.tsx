import { Div } from '@jumbo/shared';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import React from 'react';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Button, CardActions, Divider, ThemeProvider } from '@mui/material';
import { MessagesHeader } from './MessagesHeader';
import { MessagesList } from './MessagesList';
import { MessagesTriggerButton } from './MessagesTriggerButton';
import { SearchMessages } from './SearchMessages';
import { SettingHeader } from './SettingHeader';
import { SettingsList } from './SettingsList';
import dynamic from 'next/dynamic';

const JumboDdPopover = dynamic(() =>
  import('@jumbo/components').then((mod) => mod.JumboDdPopover),
  { ssr: false }
);

const MessagesPopover = () => {
  const [showSettings, setShowSettings] = React.useState<boolean>(false);
  const { theme } = useJumboTheme();

  const toggleSettingWindow = React.useCallback(() => {
    setShowSettings((showSettings) => !showSettings);
  }, [setShowSettings]);

  return (
    <ThemeProvider theme={theme}>
      <JumboDdPopover triggerButton={<MessagesTriggerButton />}>
        {showSettings ? (
          <Div sx={{ width: 360, maxWidth: '100%' }}>
            <SettingHeader backClickCallback={toggleSettingWindow} />
            <SettingsList />
          </Div>
        ) : (
          <Div sx={{ width: 360, maxWidth: '100%' }}>
            <MessagesHeader settingMenuCallback={toggleSettingWindow} />
            <Div sx={{ m: 2, mt: 0 }}>
              <SearchMessages />
            </Div>
            <MessagesList />
            <Divider />
            <CardActions sx={{ justifyContent: 'center' }}>
              <Button
                sx={{
                  textTransform: 'none',
                  fontWeight: 'normal',
                  '&:hover': { bgcolor: 'transparent' },
                }}
                size={'small'}
                variant='text'
                endIcon={<ArrowForwardIcon />}
                disableRipple
              >
                View All
              </Button>
            </CardActions>
          </Div>
        )}
      </JumboDdPopover>
    </ThemeProvider>
  );
};

export { MessagesPopover };
