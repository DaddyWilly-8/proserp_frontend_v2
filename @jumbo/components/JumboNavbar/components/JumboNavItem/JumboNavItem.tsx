import { Link } from '@jumbo/shared';
import { NavbarItem } from '@jumbo/types';
import CircleIcon from '@mui/icons-material/Circle';
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  SxProps,
  Theme,
} from '@mui/material';
import { useJumboNavItemSx, useJumboNavbar } from '../../hooks';
import { Icon } from '@jumbo/components/Icon';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';

type JumboNavItemProps = {
  item: NavbarItem | undefined;
  isNested: boolean;
  depth?: number; // Added depth prop
};

function JumboNavItem({ item, isNested, depth = 0 }: JumboNavItemProps) {
  const navSx: SxProps<Theme> = useJumboNavItemSx(item?.path ?? '');
  const { miniAndClosed } = useJumboNavbar();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  if (!item) return null;

  const handleClick = (e: React.MouseEvent) => {
    if (item?.path && item.path !== pathname) {
      e.preventDefault();
      setIsLoading(true);
      router.push(item.path);
    }
  };

  // Reset loading state when route changes
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  return (
    <>
      <ListItemButton 
        component={'li'} 
        onClick={handleClick}
        disabled={isLoading}
        sx={{ 
          ...navSx,
          // Dynamic padding based on depth and nested status
          pl: isNested ? (miniAndClosed ? 2 : 4 + (depth * 2)) : 2,
          // Visual indicator for nested items
          ...(isNested && !miniAndClosed && {
            borderLeft: (theme) => `2px solid ${theme.palette.divider}`,
            ml: 2,
          }),
          // Loading state styling
          ...(isLoading && {
            opacity: 0.7,
            pointerEvents: 'none',
          }),
        }}
      >
        <Link
          underline={'none'}
          href={item.path}
          {...(item.target ? { target: item.target } : {})}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            position: 'relative',
            color: 'inherit',
            p: (theme: Theme) =>
              !miniAndClosed
                ? theme.spacing(1, 3.75)
                : 0,
            ...(miniAndClosed ? { justifyContent: 'center' } : {}),
          }}
          aria-disabled={isLoading}
        >
          <ListItemIcon
            sx={{ 
              minWidth: miniAndClosed ? 20 : 32, 
              color: 'inherit',
              // Smaller icon for nested items
              ...(isNested && {
                minWidth: miniAndClosed ? 16 : 24,
              }),
              // Loading state for icon
              ...(isLoading && {
                color: (theme) => theme.palette.action.disabled,
              }),
            }}
          >
            {isNested ? (
              <CircleIcon sx={{ 
                fontSize: 6, 
                ml: 1,
                // Different color for nested items
                color: (theme) => theme.palette.text.secondary,
              }} />
            ) : (
              <Icon name={item.icon || '·'} sx={{ fontSize: 15 }} />
            )}
          </ListItemIcon>
          {!miniAndClosed && (
            <ListItemText
              primary={item.label}
              sx={{
                m: 0,
                '& .MuiTypography-root': {
                  whiteSpace: 'nowrap',
                  fontSize: 13,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  // Different typography for nested items
                  ...(isNested && {
                    fontSize: 10,
                    fontWeight: 'normal',
                  }),
                  // Loading state for text
                  ...(isLoading && {
                    color: (theme) => theme.palette.text.disabled,
                  }),
                },
              }}
            />
          )}
        </Link>
      </ListItemButton>
      {isLoading && <BackdropSpinner isRouterTransfer={true}/>}
    </>
  );
}

export { JumboNavItem };