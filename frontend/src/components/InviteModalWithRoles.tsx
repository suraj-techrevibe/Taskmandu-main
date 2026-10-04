import React, { useEffect, useState } from 'react';
import InviteMemberModal from './InviteMemberModal';
import { listRoles } from '../services/access';
import type { RoleDef } from '../types';

export default function InviteModalWithRoles({
  onClose,
  onInvited,
}: {
  onClose: () => void;
  onInvited: () => void;
}) {
  const [roles, setRoles] = useState<RoleDef[] | null>(null);

  useEffect(() => {
    void listRoles()
      .then(setRoles)
      .catch(() => setRoles([]));
  }, []);

  if (!roles) return null;

  return <InviteMemberModal roles={roles} onClose={onClose} onInvited={onInvited} />;
}
