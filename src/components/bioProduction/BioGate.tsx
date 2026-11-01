'use client'

import React from 'react';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';

/** Shows its page only to someone who holds at least one of the permissions; anyone else gets the usual "no permission" screen. */
const BioGate = ({ anyOf, children }: { anyOf: readonly string[]; children: React.ReactNode }) => {
  const { checkOrganizationPermission } = useJumboAuth();

  if (!checkOrganizationPermission([...anyOf])) return <UnauthorizedAccess />;

  return <React.Fragment>{children}</React.Fragment>;
};

export default BioGate;
